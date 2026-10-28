// Serves ./build and takes corrections to the transcriptions.
//   node serve.mjs                      http on 0.0.0.0:8090
//   SIB_TLS=1 node serve.mjs            https, with a self-signed cert in .local/ (for expose-site)
//   PORT=8095 HOST=127.0.0.1 node serve.mjs
//
// Corrections API (used by the "Correct" buttons in edit mode):
//   GET  api/ping                        → { ok: true }
//   GET  api/source?src=FILE:A-B;FILE:C-D → the current text of those source lines
//   POST api/correct  { parts: [{ file, start, end, original, text }], note }
//        Checks each part still reads `original`, writes `text` in its place, appends the change to
//        corrections/log.jsonl and rebuilds the site.
//   GET  api/log                         → the most recent corrections
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { execFileSync, spawn } from 'node:child_process';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const BUILD = path.join(ROOT, 'build');
const TRANSCRIPTION = path.join(ROOT, 'transcription');
const LOG = path.join(ROOT, 'corrections', 'log.jsonl');
const PORT = +(process.env.PORT || 8090);
const HOST = process.env.HOST || '0.0.0.0';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
};

// Only transcription pages can be edited: "pdf033.md" or "genesis/pdf214.md".
function sourcePath(file) {
  if (!/^(?:[a-z0-9-]+\/)?pdf\d{3}\.md$/.test(file)) throw new Error(`not a transcription file: ${file}`);
  return path.join(TRANSCRIPTION, file);
}
function parseSrc(src) {
  return String(src).split(';').filter(Boolean).map((p) => {
    const m = p.match(/^(.+):(\d+)-(\d+)$/);
    if (!m) throw new Error(`bad source reference: ${p}`);
    return { file: m[1], start: +m[2], end: +m[3] };
  });
}
const readLines = (file) => fs.readFileSync(sourcePath(file), 'utf8').split('\n');

let queue = Promise.resolve(); // one correction (and rebuild) at a time
function rebuild() {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, ['build.mjs'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`build failed: ${err.slice(-500)}`))));
  });
}

function applyCorrection({ parts, note }) {
  if (!Array.isArray(parts) || !parts.length) throw Object.assign(new Error('no parts'), { status: 400 });
  // Apply bottom-up within each file so earlier line numbers stay valid when a part grows or shrinks.
  const byFile = {};
  for (const p of parts) (byFile[p.file] ??= []).push(p);
  const changes = [];
  for (const [file, ps] of Object.entries(byFile)) {
    const lines = readLines(file);
    for (const p of ps) {
      const current = lines.slice(p.start - 1, p.end).join('\n');
      if (current !== p.original) {
        throw Object.assign(new Error(`${file} lines ${p.start}-${p.end} have changed since you opened them; reload and try again`), { status: 409 });
      }
    }
    for (const p of [...ps].sort((a, b) => b.start - a.start)) {
      const text = String(p.text).replace(/\r\n?/g, '\n').replace(/\n+$/, '');
      if (text === p.original) continue;
      lines.splice(p.start - 1, p.end - p.start + 1, ...text.split('\n'));
      changes.push({ file, start: p.start, end: p.end, before: p.original, after: text });
    }
    fs.writeFileSync(sourcePath(file), lines.join('\n'));
  }
  if (changes.length) {
    fs.mkdirSync(path.dirname(LOG), { recursive: true });
    fs.appendFileSync(LOG, `${JSON.stringify({ at: new Date().toISOString(), note: note || '', changes })}\n`);
  }
  return changes;
}

async function api(req, res, url) {
  const send = (status, body) => {
    res.writeHead(status, { 'content-type': TYPES['.json'], 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  try {
    if (url.pathname.endsWith('/ping')) return send(200, { ok: true });
    if (url.pathname.endsWith('/source')) {
      const parts = parseSrc(url.searchParams.get('src')).map((p) => ({ ...p, text: readLines(p.file).slice(p.start - 1, p.end).join('\n') }));
      return send(200, { parts });
    }
    if (url.pathname.endsWith('/log')) {
      const rows = fs.existsSync(LOG) ? fs.readFileSync(LOG, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
      return send(200, { corrections: rows.slice(-50).reverse() });
    }
    if (url.pathname.endsWith('/correct') && req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 1e6) throw Object.assign(new Error('too large'), { status: 413 }); }
      const body = JSON.parse(raw);
      const result = queue.then(async () => {
        const changes = applyCorrection(body);
        if (changes.length) await rebuild();
        return changes;
      });
      queue = result.catch(() => {});
      return send(200, { ok: true, changes: await result });
    }
    return send(404, { error: 'unknown endpoint' });
  } catch (e) {
    return send(e.status || 400, { error: e.message });
  }
}

function serveStatic(req, res, url) {
  let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(BUILD, rel);
  if (!file.startsWith(BUILD + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    return res.end('Not found');
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
  fs.createReadStream(file).pipe(res);
}

function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/api/')) return api(req, res, url);
  return serveStatic(req, res, url);
}

if (!fs.existsSync(path.join(BUILD, 'index.html'))) execFileSync(process.execPath, ['build.mjs'], { cwd: ROOT, stdio: 'inherit' });

let server;
if (process.env.SIB_TLS) {
  const dir = path.join(ROOT, '.local');
  const key = path.join(dir, 'key.pem'), cert = path.join(dir, 'cert.pem');
  if (!fs.existsSync(cert)) {
    fs.mkdirSync(dir, { recursive: true });
    execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '825', '-subj', '/CN=self-interpreting-bible',
      '-keyout', key, '-out', cert], { stdio: 'ignore' });
  }
  server = https.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(cert) }, handler);
} else {
  server = http.createServer(handler);
}
server.listen(PORT, HOST, () => console.log(`${process.env.SIB_TLS ? 'https' : 'http'}://${HOST}:${PORT}/`));
