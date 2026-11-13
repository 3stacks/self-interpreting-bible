// Exports the text of the Bible for the mobile app in app/: one JSON file per chapter, the KJV per
// book for the reference sheet, and an index. It uses the same lib/ modules as build.mjs, so the
// app shows the same verses, margin entries and notes as the website.
//   node tools/app-data.mjs            writes app/data/ and prints the size
//   node tools/app-data.mjs --if-ready  the same, but does nothing when `marked` is not installed
//
// A rich text is a list of segments. A segment is a plain string, or [text, flags] or
// [text, flags, ref]. The flags are in FLAG below. `ref` is a reference id such as "Isa.9.6-7".
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { BOOKS } from '../lib/books.mjs';
import { makeLinker } from '../lib/refs.mjs';
import { parseBook } from '../lib/genesis.mjs';
import { ANNOTATED } from '../lib/annotated.mjs';
import { VOLUMES } from '../lib/volumes.mjs';
import { annotateMeasures, CONVERSION_NOTE } from '../lib/measures.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'app', 'data');

let marked;
try {
  marked = createRequire(import.meta.url)('marked').marked;
} catch {
  if (process.argv.includes('--if-ready')) {
    console.log('app-data: `marked` is not installed at the repository root. Run `npm run data` in app/.');
    process.exit(0);
  }
  throw new Error('Install the root packages first: npm ci (at the repository root).');
}

export const FLAG = { i: 1, b: 2, sc: 4, key: 8, measure: 16, unsure: 32, fn: 64, ver: 128 };

// ---------- KJV ----------
const kjvSrc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kjv-src.json'), 'utf8').replace(/^﻿/, ''));
const kjv = Object.fromEntries(BOOKS.map(([code], i) => [code, kjvSrc[i].chapters]));

// ---------- Brown's books ----------
const books = new Map();
for (const meta of ANNOTATED) {
  const dir = path.join(ROOT, 'transcription', meta.dir);
  if (!fs.existsSync(dir)) continue;
  const parsed = parseBook(dir);
  if (!parsed.pages.length) continue;
  books.set(meta.code, { meta, parsed });
}
const annotatedHref = Object.fromEntries([...books.values()].map((b) => [b.meta.code, { slug: b.meta.slug, chapters: new Set([...b.parsed.chapters.keys()]) }]));
const linker = makeLinker(kjv, () => {}, annotatedHref);

// ---------- HTML → segments ----------
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ', apos: "'" };
const decode = (s) => s.replace(/&(#?\w+);/g, (m, e) => ENTITIES[e] ?? (e.startsWith('#') ? String.fromCodePoint(+e.slice(1)) : m));

function segments(html) {
  const out = [];
  const stack = []; // [tagName, flag, ref]
  for (const part of html.split(/(<[^>]+>)/)) {
    if (!part) continue;
    if (part.startsWith('<')) {
      const close = part.match(/^<\/(\w+)/);
      if (close) {
        const i = stack.map((s) => s[0]).lastIndexOf(close[1].toLowerCase());
        if (i >= 0) stack.splice(i, 1);
        continue;
      }
      const tag = part.match(/^<(\w+)/)?.[1].toLowerCase();
      if (!tag || /\/>$/.test(part) || tag === 'br') continue;
      const cls = part.match(/class="([^"]*)"/)?.[1] ?? '';
      let flag = 0, ref = null;
      if (tag === 'em' || tag === 'i') flag = FLAG.i;
      else if (tag === 'strong' || tag === 'b') flag = FLAG.b;
      else if (tag === 'sup') flag = cls.includes('fn') ? FLAG.fn : FLAG.key;
      else if (tag === 'span' && cls.includes('sc')) flag = FLAG.sc;
      else if (tag === 'span' && cls.includes('conv')) flag = FLAG.measure;
      else if (tag === 'span' && cls.includes('unsure')) flag = FLAG.unsure;
      else if (tag === 'span' && cls.includes('ver')) flag = FLAG.ver;
      else if (tag === 'a') ref = part.match(/data-ref="([^"]+)"/)?.[1] ?? null;
      stack.push([tag, flag, ref]);
      continue;
    }
    const text = decode(part);
    const flags = stack.reduce((f, s) => f | s[1], 0);
    const ref = stack.findLast((s) => s[2])?.[2] ?? null;
    const prev = out.at(-1);
    const prevFlags = typeof prev === 'string' ? 0 : prev?.[1];
    const prevRef = typeof prev === 'string' ? null : (prev?.[2] ?? null);
    if (prev !== undefined && prevFlags === flags && prevRef === ref) {
      if (typeof prev === 'string') out[out.length - 1] = prev + text;
      else prev[0] += text;
    } else if (!flags && !ref) out.push(text);
    else out.push(ref ? [text, flags, ref] : [text, flags]);
  }
  // A flagged "?" is the mark of an uncertain reading. Keep only the mark.
  return out.map((s) => (typeof s !== 'string' && s[1] & FLAG.unsure ? ['?', FLAG.unsure] : s));
}

const inline = (md) => marked.parseInline(md, { gfm: true })
  .replace(/\[\?\]/g, '<span class="unsure">?</span>')
  .replace(/\[illegible\]/g, '<span class="unsure">illegible</span>');
const rich = (md) => segments(linker.linkHtml(inline(md)));

// The verse text as build.mjs renders it, without the links to margin entries.
function verseHtml(text) {
  return annotateMeasures(escapeHtml(text)
    .replace(/&lt;span class="sc"&gt;([\s\S]*?)&lt;\/span&gt;/g, '<span class="sc">$1</span>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/¶\s*/g, '¶ ')
    .replace(/\{([a-z0-9*†‡§|]{1,3})\}|\^([a-z0-9*†‡§|]+)/gi, (m, k1, k2) => `<sup class="key">${k1 || k2}</sup>`)
    .replace(/\[\?\]/g, '<span class="unsure">?</span>'));
}

const ROMAN = ['', 'I', 'II', 'III', 'IV'];

// ---------- Write ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'ch'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'kjv'), { recursive: true });
const written = [];
const write = (rel, data) => {
  fs.mkdirSync(path.dirname(path.join(OUT, rel)), { recursive: true });
  fs.writeFileSync(path.join(OUT, rel), JSON.stringify(data));
  written.push(rel);
};

const testament = (code) => {
  const i = BOOKS.findIndex(([c]) => c === code);
  if (i < 0) return 'apoc';
  return i < 39 ? 'ot' : 'nt';
};

// The canonical books in order, then the Apocrypha in the order of the printed Volume III.
const order = [
  ...BOOKS.map(([code]) => code),
  ...ANNOTATED.filter((m) => testament(m.code) === 'apoc').map((m) => m.code),
];

const index = [];
for (const code of order) {
  const b = books.get(code);
  const meta = b?.meta ?? ANNOTATED.find((m) => m.code === code);
  const name = meta?.name ?? BOOKS.find(([c]) => c === code)[1];
  const kjvChapters = kjv[code];
  const start = meta?.chapterStart ?? 1;
  const count = kjvChapters ? kjvChapters.length : meta.chapters - start + 1;
  const vol = meta?.volume ?? 1;
  const brown = [], noted = [];
  for (let n = start; n < start + count; n++) {
    const ch = b?.parsed.chapters.get(n);
    const hasText = !!ch?.verses.size;
    const kv = kjvChapters?.[n - 1];
    if (!hasText && !kv) continue;
    const data = {};
    if (hasText) {
      brown.push(n);
      const printed = ch.pages.map((pdf) => b.parsed.printed[pdf] ?? (vol === 1 ? pdf - 3 : null)).filter(Boolean);
      if (printed.length) data.p = `Vol. ${ROMAN[vol]}, ${printed.length > 1 ? `pp. ${printed[0]}–${printed.at(-1)}` : `p. ${printed[0]}`}`;
      if (ch.summary) data.s = rich(ch.summary.text);
      if (ch.title) data.t = segments(linker.linkHtml(inline(ch.title.text)).replace(/\{([a-z0-9*†‡§|]{1,3})\}/gi, '<sup class="key">$1</sup>'));
      const verses = [...ch.verses.values()].sort((a, c) => a.v - c.v);
      const have = new Set(verses.map((vs) => vs.v));
      data.v = verses.map((vs) => {
        const row = [vs.v, segments(verseHtml(vs.text))];
        const margin = vs.margin.map((e) => (e.date ? [e.key, rich(e.text), e.date] : [e.key, rich(e.text)]));
        if (margin.length || vs.heading) row.push(margin);
        if (vs.heading) row.push(vs.heading);
        return row;
      });
      // A verse that the transcription does not have yet comes from the KJV, marked as such.
      if (kv) {
        const missing = kv.map((t, i) => i + 1).filter((v) => !have.has(v));
        if (missing.length) {
          data.v.push(...missing.map((v) => [v, [kv[v - 1]], [], null, 1]));
          data.v.sort((a, c) => a[0] - c[0]);
        }
      }
      if (ch.margin.length) data.lm = ch.margin.map((e) => [e.key, rich(e.text), e.v ?? 0]);
      if (ch.notes.length) {
        noted.push(n);
        data.n = ch.notes.map((note) => {
          const html = annotateMeasures(linker.linkHtml(inline(note.text)).replace(/\{([0-9*†‡§]{1,2})\}/g, '<sup class="fn">$1</sup>'))
            .replace(/^(\[?)(Ver\.\s*[\d,\s\-–]+\.)/, '$1<span class="ver">$2</span>');
          const ver = note.text.match(/^\[?Ver\.\s*(\d+)/);
          const kind = note.heading ? 2 : /^\*\*Reflections\.\*\*/.test(note.text) ? 1 : 0;
          return [segments(html), ver ? +ver[1] : 0, kind];
        });
      }
      data.m = JSON.stringify(data).includes(`,${FLAG.measure}]`) ? 1 : 0;
      if (!data.m) delete data.m;
    } else {
      data.k = 1;
      data.v = kv.map((t, i) => [i + 1, [t]]);
    }
    write(`ch/${code}/${n}.json`, data);
  }
  if (kjvChapters) write(`kjv/${code}.json`, kjvChapters);
  const entry = { code, name, t: testament(code), start, count, brown, noted };
  if (meta?.chapterName) entry.cn = meta.chapterName;
  if (meta?.eyebrow) entry.eb = meta.eyebrow;
  if (b) {
    entry.vol = vol;
    if (b.parsed.title) entry.title = b.parsed.title;
    if (b.parsed.intro.length) entry.intro = b.parsed.intro.map((p) => rich(p.text));
  }
  index.push(entry);
}
write('index.json', { books: index, conversionNote: CONVERSION_NOTE, volumes: VOLUMES.map((v) => v.roman) });

// A static require for each file, so Metro puts all of them in the bundle.
const lines = written.filter((f) => f !== 'index.json').map((f) => `  '${f.replace(/\.json$/, '')}': () => require('./${f}'),`);
fs.writeFileSync(path.join(OUT, 'files.ts'), `// Written by tools/app-data.mjs. Do not edit.
/* eslint-disable */
export const files: Record<string, () => unknown> = {
${lines.join('\n')}
}
`);

let bytes = 0;
for (const f of written) bytes += fs.statSync(path.join(OUT, f)).size;
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;
const chapters = written.filter((f) => f.startsWith('ch/')).length;
console.log(`app-data: ${index.length} books, ${chapters} chapters, ${written.length} files, ${mb(bytes)} in app/data`);
