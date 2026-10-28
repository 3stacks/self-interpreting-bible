// Builds the static site in ./build from the page transcriptions in ./transcription.
//   node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { marked } from 'marked';
import { BOOKS, BOOK_NAME } from './lib/books.mjs';
import { makeLinker } from './lib/refs.mjs';
import { PARTS } from './lib/contents.mjs';
import { renderGenealogyChart } from './lib/genealogy.mjs';
import { parseBook, toRoman } from './lib/genesis.mjs';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'build');
const VOLUME = { n: 1, roman: 'I', pdfToPrinted: (p) => p - 3 };

fs.mkdirSync(path.join(OUT, 'kjv'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'scans'), { recursive: true });

// ---------- KJV ----------
const kjvSrc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kjv-src.json'), 'utf8').replace(/^﻿/, ''));
const kjv = {};
BOOKS.forEach(([code], i) => {
  kjv[code] = kjvSrc[i].chapters;
  fs.writeFileSync(path.join(OUT, 'kjv', `${code}.json`), JSON.stringify(kjvSrc[i].chapters));
});
fs.writeFileSync(
  path.join(OUT, 'kjv', 'books.json'),
  JSON.stringify(BOOKS.map(([code, name], i) => [code, name, kjvSrc[i].chapters.length])),
);

// ---------- Transcriptions → sections ----------
const files = fs.readdirSync(path.join(ROOT, 'transcription')).filter((f) => /^pdf\d{3}\.md$/.test(f)).sort();
const sections = new Map(); // slug → { slug, title, pages: [], md: '' }
const order = [];
for (const f of files) {
  const pdf = +f.slice(3, 6);
  const text = fs.readFileSync(path.join(ROOT, 'transcription', f), 'utf8');
  const marks = [...text.matchAll(/<!--\s*(section|continued):\s*([a-z0-9-]+)\s*-->/g)];
  marks.forEach((mk, i) => {
    const [, kind, slug] = mk;
    const from = mk.index + mk[0].length;
    const raw = text.slice(from, marks[i + 1]?.index ?? text.length);
    let s = sections.get(slug);
    if (!s) {
      s = { slug, title: slug, pages: [], md: '' };
      sections.set(slug, s);
      order.push(slug);
    }
    if (kind === 'section') {
      const h = raw.match(/^#\s+(.+)$/m);
      if (h) s.title = h[1].trim().replace(/[,:;.]+$/, '');
    }
    if (!s.pages.includes(pdf)) s.pages.push(pdf);
    const body = markSource(raw, f, text.slice(0, from).split('\n').length);
    s.md += `\n\n<div class="page-break" data-pdf="${pdf}"></div>\n\n` + body.replace(/^#\s+.+$/m, '');
  });
}

// Tag each table row, heading, list item and paragraph with the file and lines it came from
// ("⟦pdf033.md:14-16⟧"), so the rendered block can offer a correction against its source.
function markSource(body, file, first) {
  const lines = body.split('\n');
  const tag = (a, b) => ` ⟦${file}:${a}-${b}⟧`;
  const breaks = /^(\||#|<!--|[-*]\s|\d+\.\s)/;
  let inComment = false, paraStart = null;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim(), n = first + i;
    if (inComment) { if (t.includes('-->')) inComment = false; continue; }
    if (t.startsWith('<!--')) { if (!t.includes('-->')) inComment = true; continue; }
    if (!t) continue;
    if (t.startsWith('|')) {
      if (!/^\|[\s:|-]+$/.test(t)) lines[i] = lines[i].replace(/\|\s*$/, `${tag(n, n)} |`);
    } else if (/^(#{1,6}|[-*]|\d+\.)\s/.test(t)) {
      lines[i] += tag(n, n);
    } else {
      paraStart ??= n;
      const next = (lines[i + 1] ?? '').trim();
      if (!next || breaks.test(next)) { lines[i] += tag(paraStart, n); paraStart = null; }
    }
  }
  return lines.join('\n');
}
const srcAttr = (parts) => (parts?.length ? ` data-src="${parts.map((p) => `${p.file}:${p.start}-${p.end}`).join(';')}"` : '');

// ---------- Genesis, with Brown's text, margin and notes ----------
const GEN = parseBook(path.join(ROOT, 'transcription', 'genesis'));
const genSlug = (n) => `genesis-${n}`;
const genPrinted = (pdf) => GEN.printed[pdf] ?? VOLUME.pdfToPrinted(pdf);
const genChapters = [...GEN.chapters.keys()].filter((n) => GEN.chapters.get(n).verses.size).sort((a, b) => a - b);

// ---------- Scans (stored upside down in the PDF; turn them upright for the web) ----------
for (const pdf of new Set([...sections.values()].flatMap((s) => s.pages).concat(GEN.pages))) {
  const src = path.join(ROOT, 'scans', `pdf${String(pdf).padStart(3, '0')}.png`);
  const dst = path.join(OUT, 'scans', `pdf${String(pdf).padStart(3, '0')}.png`);
  if (fs.existsSync(src) && !fs.existsSync(dst)) execFileSync('convert', [src, '-rotate', '180', dst]);
}
// Most plates are printed sideways with the caption up the right edge; turn those upright.
const UPRIGHT_PLATES = new Set([253, 255]);
for (const { pdf } of GEN.plates) {
  const src = path.join(OUT, 'scans', `pdf${pdf}.png`);
  const turn = UPRIGHT_PLATES.has(pdf) ? [] : ['-rotate', '90'];
  const thumb = path.join(OUT, 'scans', `thumb-pdf${pdf}.jpg`), big = path.join(OUT, 'scans', `plate-pdf${pdf}.jpg`);
  if (!fs.existsSync(thumb)) execFileSync('convert', [src, ...turn, '-trim', '-resize', '1000x', '-quality', '78', thumb]);
  if (!fs.existsSync(big)) execFileSync('convert', [src, ...turn, '-trim', '-resize', '2400x', '-quality', '82', big]);
}

// ---------- Rendering ----------
const rejected = {}; // slug → refs that looked like scripture but didn't validate
let currentSlug = '';
const linker = makeLinker(kjv, (r) => (rejected[currentSlug] ??= []).push(r));
const backlinks = {}; // "Gen.10" → [{slug, id}]
const searchDocs = [];
const unsure = [];

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const slugify = (s) => stripTags(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const GLOSSARIES = new Set(['obsolete-words', 'glossary-of-symbolic-words', 'precious-stones', 'trees-and-plants', 'mountains-and-hills', 'rivers-lakes-seas']);

function renderSection(s) {
  currentSlug = s.slug;
  let html = marked.parse(s.md, { gfm: true });
  // Transcriber comments: chart notes and margin dates become visible; layout notes are dropped.
  html = html.replace(/<!--\s*chart:\s*([\s\S]*?)-->/g, (m, d) => `<p class="chart-note"><span>Transcriber’s note</span> ${escapeHtml(d.trim())}</p>`);
  html = html.replace(/<!--\s*editor:\s*([\s\S]*?)-->/g, (m, d) => `<p class="chart-note"><span>Editor’s note</span> ${escapeHtml(d.trim())}</p>`);
  html = html.replace(/<!--\s*when-written-bc:\s*([\s\S]*?)-->/g, (m, d) => `<p class="written">Written B.C. ${escapeHtml(d.trim())}</p>`);
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  // Move each block's source tag into a data-src attribute.
  html = html.replace(/<(tr|p|h[1-6]|li)>([\s\S]*?)<\/\1>/g, (m, tag, inner) => {
    const src = [...inner.matchAll(/⟦([^⟧]+)⟧/g)].map((x) => x[1]);
    return src.length ? `<${tag} data-src="${src.join(';')}">${inner.replace(/\s*⟦[^⟧]+⟧/g, '')}</${tag}>` : m;
  }).replace(/\s*⟦[^⟧]+⟧/g, '');
  html = html.replace(/\[\?\]/g, '<span class="unsure" title="Uncertain reading of the scan">?</span>');
  html = html.replace(/\[illegible\]/g, '<span class="unsure illegible" title="Unreadable in the scan">illegible</span>');
  html = linker.linkHtml(html);

  // Anchors for headings, rows and paragraphs so search results and backlinks can point at them.
  let n = 0;
  const ids = new Set();
  html = html.replace(/<h([23])((?: data-src="[^"]*")?)>(.*?)<\/h\1>/g, (m, l, attrs, inner) => {
    let id = slugify(inner) || `h${n}`;
    while (ids.has(id)) id += '-x';
    ids.add(id);
    return `<h${l} id="${id}"${attrs}><a class="hash" href="#${id}" aria-label="Link to this heading">§</a>${inner}</h${l}>`;
  });
  html = html.replace(/<(tr|p)((?: data-src="[^"]*")?)>/g, (m, tag, attrs) => `<${tag} id="r${++n}"${attrs}>`);

  // Index each anchored block for search, backlinks and the proofing list.
  const blockRe = /<(tr|p|h[23]) id="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g;
  let b;
  while ((b = blockRe.exec(html))) {
    const [, , id, attrs, inner] = b;
    const text = stripTags(inner.replace(/<a class="hash"[^>]*>§<\/a>/, '').replace(/<\/t[dh]>/g, ' · '));
    if (text) searchDocs.push([s.slug, id, text.replace(/( · )+$/, '')]);
    for (const r of inner.matchAll(/data-ref="([^"]+)"/g)) {
      const [code, ch] = r[1].split('.');
      ((backlinks[`${code}.${ch}`] ??= [])).push([s.slug, id, r[1]]);
    }
    if (inner.includes('class="unsure')) unsure.push([s.slug, id, text, attrs.match(/data-src="([^"]+)"/)?.[1]]);
  }

  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  html = html.replace(/<div class="page-break" data-pdf="(\d+)"><\/div>/g, (m, pdf) => pageMarker(+pdf, s));

  if (s.slug === 'genealogy-of-the-patriarchs') html = renderGenealogyChart(s.md) + html;
  if (GLOSSARIES.has(s.slug)) html = letterIndex(html) ;
  return html;
}

function pageMarker(pdf, s) {
  const first = s.pages[0] === pdf;
  const label = `Vol. ${VOLUME.roman}, p. ${VOLUME.pdfToPrinted(pdf)}`;
  return `<div class="page-marker${first ? ' first' : ''}" id="p${VOLUME.pdfToPrinted(pdf)}">
  <span>${first ? 'Begins' : 'Continues'} on ${label}</span>
  <button type="button" class="scan-btn" data-scan="scans/pdf${String(pdf).padStart(3, '0')}.png" data-label="${label}">View page scan</button>
</div>`;
}

// A–Z jump bar for glossary-style tables: anchor the first row of each initial letter.
function letterIndex(html) {
  const seen = new Set();
  html = html.replace(/<tr id="(r\d+)">\s*<td>(?:<[^>]+>)*([A-Za-z])/g, (m, id, ch) => {
    const L = ch.toUpperCase();
    if (seen.has(L)) return m;
    seen.add(L);
    return m.replace(`<tr id="${id}">`, `<tr id="${id}" data-letter="${L}">`);
  });
  if (seen.size < 5) return html;
  const bar = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
    .map((L) => (seen.has(L) ? `<a href="#letter-${L}">${L}</a>` : `<span>${L}</span>`)).join('');
  html = html.replace(/<tr id="(r\d+)" data-letter="([A-Z])">/g, '<tr id="$1" data-letter="$2"><td hidden id="letter-$2"></td>'.replace('<td hidden id="letter-$2"></td>', ''));
  html = html.replace(/<tr id="(r\d+)" data-letter="([A-Z])">\s*<td>/g, '<tr id="$1" data-letter="$2"><td><span class="letter-anchor" id="letter-$2"></span>');
  return `<nav class="letters" aria-label="Jump to letter">${bar}</nav>\n${html}`;
}

// ---------- Page shell ----------
const partOf = {};
for (const p of PARTS) for (const slug of p.slugs) partOf[slug] = p;
const contentsOrder = [...PARTS.flatMap((p) => p.slugs.filter((s) => sections.has(s))), ...order.filter((s) => !partOf[s])];
const other = order.filter((s) => !partOf[s]);
const parts = [...PARTS, ...(other.length ? [{ title: 'Other Tables', blurb: '', slugs: other }] : [])];

function sidebar(active) {
  return parts.map((p) => {
    const items = p.slugs.filter((s) => sections.has(s));
    if (!items.length) return '';
    return `<div class="toc-part"><p class="toc-head">${p.title}</p><ul>${items
      .map((s) => `<li><a href="${s}.html"${s === active ? ' aria-current="page"' : ''}>${sections.get(s).title}</a></li>`)
      .join('')}</ul></div>`;
  }).join('');
}

function layout({ title, body, active = '', bodyClass = '', withToc = true, toc = null }) {
  return `<!doctype html>
<html lang="en-GB"${REPO ? ` data-repo="${REPO}" data-branch="${BRANCH}"` : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title === SITE ? SITE : `${stripTags(title)} · ${SITE}`}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=IM+Fell+English+SC&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=IBM+Plex+Sans+Condensed:wght@400;500&display=swap">
<link rel="stylesheet" href="site.css">
</head>
<body class="${bodyClass}">
<header class="masthead">
  <div class="masthead-inner">
    <a class="brand" href="index.html"><span class="brand-sc">The Self-Interpreting Bible</span><span class="brand-sub">John Brown of Haddington</span></a>
    <nav class="topnav" aria-label="Site">
      ${withToc ? '<button type="button" class="toc-toggle" aria-expanded="false" aria-controls="toc">Contents</button>' : ''}
      <a href="index.html">Contents</a>
      <a href="bible.html">Bible</a>
      <a href="search.html">Search</a>
      <a href="proofing.html">Proofing</a>
      <button type="button" id="edit-toggle" class="edit-toggle" aria-pressed="false" hidden title="Show a ✎ on every passage, to correct the transcription">Edit</button>
      <span class="era-toggle" role="group" aria-label="Show years as"><button type="button" data-era="bc" aria-pressed="true" title="Years before Christ, as printed">B.C.</button><button type="button" data-era="am" aria-pressed="false" title="Anno Mundi: years from the Creation, on Ussher's reckoning">A.M.</button></span>
    </nav>
  </div>
</header>
<div class="shell${withToc ? '' : ' no-toc'}">
  ${withToc ? `<nav class="toc" id="toc" aria-label="Contents">${toc ?? sidebar(active)}</nav>` : ''}
  <main id="main">${body}</main>
</div>
<div class="popover" id="popover" role="tooltip" hidden></div>
<dialog class="scan-viewer" id="scan-viewer">
  <div class="scan-bar"><span id="scan-label"></span><button type="button" id="scan-close">Close</button></div>
  <div class="scan-frame"><img id="scan-img" alt="Scan of the printed page"></div>
</dialog>
<dialog class="fix-dialog" id="fix-dialog">
  <form id="fix-form" method="dialog">
    <h2>Correct the transcription</h2>
    <p class="fix-current" id="fix-current"></p>
    <p class="fix-help">Edit the source text below to match the printed page. Keep the markers as they are: <code>{a}</code> keys, <code>*italics*</code>, <code>[?]</code> for a doubtful reading (remove it once settled).</p>
    <div id="fix-parts"></div>
    <label class="fix-note">Note (optional) <input id="fix-note" type="text" placeholder="e.g. checked against the scan"></label>
    <div class="fix-actions"><span id="fix-status" aria-live="polite"></span><button type="button" id="fix-cancel">Cancel</button><button type="submit" id="fix-save">Save correction</button></div>
  </form>
</dialog>
<script src="site.js"></script>
</body>
</html>
`;
}
const SITE = 'The Self-Interpreting Bible';
// Where the transcriptions live on GitHub, for "correct this" links on a static host.
// In GitHub Actions these come from the run; locally from site.config.json if present.
const CONFIG = fs.existsSync(path.join(ROOT, 'site.config.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8')) : {};
const REPO = process.env.GITHUB_REPOSITORY || CONFIG.repo || '';
const BRANCH = process.env.GITHUB_REF_NAME || CONFIG.branch || 'main';

// ---------- Section pages ----------
const rendered = new Map();
for (const slug of order) rendered.set(slug, renderSection(sections.get(slug)));

contentsOrder.forEach((slug, i) => {
  const s = sections.get(slug);
  const prev = contentsOrder[i - 1], next = contentsOrder[i + 1];
  const part = partOf[slug];
  const printed = s.pages.map(VOLUME.pdfToPrinted);
  const pageRange = printed.length > 1 ? `pp. ${printed[0]}–${printed.at(-1)}` : `p. ${printed[0]}`;
  const body = `
<article class="section${GLOSSARIES.has(slug) ? ' glossary' : ''}" data-slug="${slug}">
  <p class="eyebrow">${part ? part.title : 'Comprehensive Aids'}</p>
  <h1>${s.title}</h1>
  <p class="source">Blackwood’s Comprehensive Aids to the Study of the Bible · Vol. ${VOLUME.roman}, ${pageRange}</p>
  ${rendered.get(slug)}
  <nav class="pager" aria-label="Previous and next">
    ${prev ? `<a class="prev" href="${prev}.html"><span>Previous</span>${sections.get(prev).title}</a>` : '<span></span>'}
    ${next ? `<a class="next" href="${next}.html"><span>Next</span>${sections.get(next).title}</a>` : '<span></span>'}
  </nav>
</article>`;
  fs.writeFileSync(path.join(OUT, `${slug}.html`), layout({ title: s.title, body, active: slug }));
});

// ---------- Genesis pages ----------
const extraTitles = {}; // slug → title, for search, backlinks and proofing
const inline = (md) => marked.parseInline(md, { gfm: true })
  .replace(/\[\?\]/g, '<span class="unsure" title="Uncertain reading of the scan">?</span>')
  .replace(/\[illegible\]/g, '<span class="unsure illegible" title="Unreadable in the scan">illegible</span>');

function genToc(active) {
  const cells = [];
  for (let n = 1; n <= 50; n++) {
    cells.push(GEN.chapters.get(n)?.verses.size
      ? `<a href="${genSlug(n)}.html"${active === n ? ' aria-current="page"' : ''}>${n}</a>`
      : `<span>${n}</span>`);
  }
  return `<div class="toc-part"><p class="toc-head"><a href="genesis.html">Genesis</a></p><div class="ch-grid">${cells.join('')}</div></div>
<div class="toc-part"><p class="toc-head"><a href="index.html">Comprehensive Aids</a></p></div>`;
}

function marginDate(d) {
  const am = d.match(/A\.\s?M\.\s*\d+\.?/), bc = d.match(/B\.\s?C\.\s*\d+\.?/);
  if (am && bc) return `<p class="mdate has-am"><span class="d-am">${am[0]}</span> <span class="d-bc">${bc[0]}</span></p>`;
  return `<p class="mdate">${escapeHtml(d)}</p>`;
}

function renderGenesisChapter(n) {
  const ch = GEN.chapters.get(n);
  const slug = genSlug(n);
  currentSlug = slug;
  const title = `Genesis ${n}`;
  extraTitles[slug] = title;
  const record = (id, html, src) => {
    const text = stripTags(html);
    if (text) searchDocs.push([slug, id, text]);
    for (const r of html.matchAll(/data-ref="([^"]+)"/g)) {
      const [code, c] = r[1].split('.');
      ((backlinks[`${code}.${c}`] ??= [])).push([slug, id, r[1]]);
    }
    if (html.includes('class="unsure')) unsure.push([slug, id, text, src?.map((p) => `${p.file}:${p.start}-${p.end}`).join(';')]);
  };

  // Notes first, so verse numbers know which verses have a note.
  const noted = new Map(); // verse → note id
  const notes = ch.notes.map((note, i) => {
    let html = linker.linkHtml(inline(note.text));
    const id = `n${n}-${i + 1}`;
    const ver = note.text.match(/^\[?Ver\.\s*(\d+)/);
    if (ver) {
      const v = +ver[1];
      if (!noted.has(v)) noted.set(v, id);
      html = html.replace(/^(\[?)(Ver\.\s*[\d,\s\-–]+\.)/, (m, b, t) => b + `<a class="ver" href="#v${n}-${v}">${t}</a>`);
    }
    const refl = /^\*\*Reflections\.\*\*/.test(note.text);
    record(id, html, note.src);
    return `<p id="${id}"${refl ? ' class="reflections"' : ''}${srcAttr(note.src)}>${html}</p>`;
  });

  let pdfSeen = new Set();
  const lastKeyId = {}; // key → margin entry id, for a key printed again in a later verse
  const verses = [...ch.verses.values()].sort((a, b) => a.v - b.v).map((vs) => {
    const vid = `v${n}-${vs.v}`;
    const keysSeen = {};
    const text = escapeHtml(vs.text)
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/¶\s*/g, '<span class="pilcrow" aria-hidden="true">¶</span> ')
      .replace(/\{([a-z0-9*†‡§]{1,3})\}|\^([a-z0-9*†‡§]+)/gi, (m, k1, k2) => {
        const k = k1 || k2;
        keysSeen[k] = (keysSeen[k] || 0) + 1;
        const id = `m${n}-${vs.v}-${k}${keysSeen[k] > 1 ? `-${keysSeen[k]}` : ''}`;
        const has = vs.margin.some((e) => e.key === k);
        const target = has ? id : lastKeyId[k];
        return target ? `<sup class="key"><a href="#${target}">${k}</a></sup>` : `<sup class="key">${k}</sup>`;
      })
      .replace(/\[\?\]/g, '<span class="unsure" title="Uncertain reading of the scan">?</span>');
    const keyCount = {};
    const margin = vs.margin.map((e) => {
      keyCount[e.key] = (keyCount[e.key] || 0) + 1;
      const id = `m${n}-${vs.v}-${e.key}${keyCount[e.key] > 1 ? `-${keyCount[e.key]}` : ''}`;
      const html = linker.linkHtml(inline(e.text));
      record(id, html, e.src);
      lastKeyId[e.key] = id;
      return `${e.date ? marginDate(e.date) : ''}<p id="${id}" class="ment"${srcAttr(e.src)}><b>${escapeHtml(e.key)}</b> ${html}</p>`;
    }).join('');
    const note = noted.get(vs.v);
    const num = note
      ? `<a class="vn has-note" href="#${note}" title="Brown’s note on verse ${vs.v}">${vs.v}</a>`
      : `<a class="vn" href="#${vid}">${vs.v}</a>`;
    if (/\[\?\]/.test(vs.text)) unsure.push([slug, vid, stripTags(text), vs.src.map((p) => `${p.file}:${p.start}-${p.end}`).join(';')]);
    let marker = '';
    if (vs.pdf && !pdfSeen.has(vs.pdf)) {
      pdfSeen.add(vs.pdf);
      const label = `Vol. ${VOLUME.roman}, p. ${genPrinted(vs.pdf)}`;
      marker = `<div class="page-marker"><span>${label}</span><button type="button" class="scan-btn" data-scan="scans/pdf${vs.pdf}.png" data-label="${label}">View page scan</button></div>`;
    }
    const plates = GEN.plates.filter((pl) => pl.after?.c === n && pl.after?.v === vs.v).map((pl) => {
      // "TITLE. [Genesis, xiii:3.]—Description…": set the title apart from the description.
      const cut = pl.caption.search(/\]\s*[—.-]*/);
      const title = cut > 0 ? pl.caption.slice(0, pl.caption.indexOf(']', cut) + 1) : pl.caption.split(/(?<=\.)\s/)[0];
      const rest = pl.caption.slice(title.length).replace(/^[\s—.-]+/, '');
      return `<figure class="plate"><button type="button" class="scan-btn plate-btn" data-scan="scans/plate-pdf${pl.pdf}.jpg" data-label="${escapeHtml(title)}" aria-label="Enlarge: ${escapeHtml(title)}"><img src="scans/thumb-pdf${pl.pdf}.jpg" alt="${escapeHtml(title)}" loading="lazy"></button><figcaption><b>${escapeHtml(title)}</b>${rest ? ` ${escapeHtml(rest)}` : ''}</figcaption></figure>`;
    }).join('');
    return `${marker}<div class="verse" id="${vid}"${srcAttr(vs.src)}><p class="vt">${num} ${text}</p>${margin ? `<div class="vm">${margin}</div>` : ''}</div>${plates}`;
  });
  const loose = ch.margin.map((e) => `${e.date ? marginDate(e.date) : ''}<p class="ment"${srcAttr(e.src)}><b>${escapeHtml(e.key)}</b> ${linker.linkHtml(inline(e.text))}${e.v ? ` <span class="muted">(ver. ${e.v})</span>` : ''}</p>`).join('');

  const i = genChapters.indexOf(n);
  const prev = genChapters[i - 1], next = genChapters[i + 1];
  const printed = ch.pages.map(genPrinted);
  const body = `
<article class="section chapter" data-slug="${slug}">
  <p class="eyebrow">The First Book of Moses, called Genesis</p>
  <h1>Genesis ${n}</h1>
  <p class="source">Chapter ${toRoman(n)} · Vol. ${VOLUME.roman}, ${printed.length > 1 ? `pp. ${printed[0]}–${printed.at(-1)}` : `p. ${printed[0]}`}</p>
  ${ch.summary ? `<p class="summary"${srcAttr(ch.summary.src)}>${linker.linkHtml(inline(ch.summary.text))}</p>` : ''}
  <div class="chapter-tools"><label><input type="checkbox" id="show-margin" checked> Margin references</label><a href="bible.html#Gen.${n}">Plain KJV</a>${ch.notes.length ? `<a href="#notes">Notes ↓</a>` : ''}</div>
  <div class="scripture">${verses.join('\n')}</div>
  ${loose ? `<aside class="loose-margin"><h2>Other margin entries</h2>${loose}</aside>` : ''}
  ${ch.notes.length ? `<section class="notes" id="notes"><h2>Notes</h2>${notes.join('\n')}</section>` : ''}
  <nav class="pager" aria-label="Previous and next">
    ${prev ? `<a class="prev" href="${genSlug(prev)}.html"><span>Previous</span>Genesis ${prev}</a>` : '<a class="prev" href="genesis.html"><span>Previous</span>Introduction</a>'}
    ${next ? `<a class="next" href="${genSlug(next)}.html"><span>Next</span>Genesis ${next}</a>` : '<span></span>'}
  </nav>
</article>`;
  fs.writeFileSync(path.join(OUT, `${slug}.html`), layout({ title, body, toc: genToc(n), bodyClass: 'annotated' }));
}

if (genChapters.length) {
  for (const n of genChapters) renderGenesisChapter(n);
  extraTitles.genesis = 'Genesis';
  const introBody = `
<article class="section">
  <p class="eyebrow">Volume ${VOLUME.roman}</p>
  <h1>${escapeHtml(GEN.title || 'Genesis')}</h1>
  <p class="source">With John Brown’s marginal references, notes and reflections · Vol. ${VOLUME.roman}, p. ${genPrinted(GEN.pages[0])}</p>
  ${GEN.intro.map((p) => `<p${srcAttr(p.src)}>${linker.linkHtml(inline(p.text))}</p>`).join('\n')}
  <h2>Chapters</h2>
  <div class="ch-grid big">${Array.from({ length: 50 }, (_, k) => k + 1).map((n) => (genChapters.includes(n) ? `<a href="${genSlug(n)}.html">${n}</a>` : `<span>${n}</span>`)).join('')}</div>
</article>`;
  fs.writeFileSync(path.join(OUT, 'genesis.html'), layout({ title: 'Genesis', body: introBody, toc: genToc(0) }));
}

// ---------- Contents ----------
const totalRefs = Object.values(backlinks).reduce((a, l) => a + l.length, 0);
const indexBody = `
<section class="hero">
  <p class="eyebrow">Volume ${VOLUME.roman} · Genesis to Joshua</p>
  <h1>The Self-Interpreting Bible</h1>
  <p class="lede">John Brown of Haddington’s family Bible, with its explanatory notes, reflections and marginal references. Genesis is here in full: the text with Brown’s centre-column references, his explanatory notes and the reflections on every chapter. So are Blackwood’s <em>Comprehensive Aids to the Study of the Bible</em>: tables of chronology, prophecy, kings and priests, glossaries and indexes. Everything is transcribed from the printed pages, with every scripture reference linked to the text.</p>
  <dl class="facts">
    <div><dt>Tables and essays</dt><dd>${contentsOrder.length}</dd></div>
    <div><dt>Pages transcribed</dt><dd>${(files.length + GEN.pages.length).toLocaleString('en-GB')}</dd></div>
    <div><dt>Scripture references linked</dt><dd>${totalRefs.toLocaleString('en-GB')}</dd></div>
  </dl>
</section>
<div class="contents">
${genChapters.length ? `<section class="part">
  <h2>Genesis, with Brown’s Notes</h2>
  <p class="part-blurb">The text of Genesis with the centre-column references, the explanatory notes and the reflections on each chapter.</p>
  <p><a href="genesis.html">Introduction to Genesis</a></p>
  <div class="ch-grid big">${Array.from({ length: 50 }, (_, k) => k + 1).map((n) => (genChapters.includes(n) ? `<a href="${genSlug(n)}.html">${n}</a>` : `<span>${n}</span>`)).join('')}</div>
</section>` : ''}
${parts.map((p) => {
  const items = p.slugs.filter((s) => sections.has(s));
  if (!items.length) return '';
  return `<section class="part">
  <h2>${p.title}</h2>
  ${p.blurb ? `<p class="part-blurb">${p.blurb}</p>` : ''}
  <ol>${items.map((s) => {
    const sec = sections.get(s);
    return `<li><a href="${s}.html">${sec.title}</a><span class="pg">${VOLUME.pdfToPrinted(sec.pages[0])}</span></li>`;
  }).join('')}</ol>
</section>`;
}).join('\n')}
</div>
<p class="colophon">Scripture text: King James Version (1769). Transcriptions are a first pass from the scanned pages; question marks in the text flag uncertain readings. See the <a href="proofing.html">proofing list</a>.</p>`;
const indexHtml = layout({ title: SITE, body: indexBody, bodyClass: 'home', withToc: false });
fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml);
// The Artifact host supplies the document skeleton for the main page, so emit a bare-body copy.
fs.writeFileSync(
  path.join(ROOT, 'artifact-index.html'),
  indexHtml
    .replace(/^<!doctype html>\s*<html[^>]*>\s*<head>\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/, '')
    .replace(/<\/head>\s*<body[^>]*>/, '')
    .replace(/<\/body>\s*<\/html>\s*$/, ''),
);

// ---------- Bible reader ----------
const bibleBody = `
<article class="reader">
  <form class="reader-nav" id="reader-nav">
    <label for="rb">Book</label>
    <select id="rb">${BOOKS.map(([c, n]) => `<option value="${c}">${n}</option>`).join('')}</select>
    <label for="rc">Chapter</label>
    <select id="rc"></select>
  </form>
  <h1 id="reader-title">Genesis 1</h1>
  <div class="reader-grid">
    <div><p id="reader-annotated" class="reader-annotated"></p><div id="reader-text" class="chapter-text" aria-live="polite"></div></div>
    <aside class="cited" id="cited" aria-label="Cited in the Aids"></aside>
  </div>
  <nav class="pager" id="reader-pager" aria-label="Previous and next chapter"></nav>
</article>`;
fs.writeFileSync(path.join(OUT, 'bible.html'), layout({ title: 'Bible', body: bibleBody, bodyClass: 'bible', withToc: false }));

// ---------- Search ----------
const searchBody = `
<article class="search-page">
  <h1>Search the Aids</h1>
  <form id="search-form" role="search">
    <label for="q" class="visually-hidden">Search</label>
    <input id="q" type="search" placeholder="A word, a name, or a reference such as Isa. liii" autocomplete="off">
  </form>
  <p id="search-count" class="search-count"></p>
  <ol id="search-results" class="search-results"></ol>
</article>`;
fs.writeFileSync(path.join(OUT, 'search.html'), layout({ title: 'Search', body: searchBody, bodyClass: 'search', withToc: false }));

// ---------- Proofing list ----------
const proofBody = `
<article class="section">
  <p class="eyebrow">Transcription</p>
  <h1>Proofing List</h1>
  <p>Readings marked uncertain while transcribing the scans, and scripture-like references that did not match a real chapter and verse. Each is worth checking against the page scan.</p>
  <p class="fix-help">To correct one, press its ✎, compare with the page scan and save. Anywhere else on the site, press <b>Edit</b> in the top bar to put a ✎ on every verse, note, margin entry and table row.</p>
  <section id="recent-fixes" class="recent-fixes" hidden><h2>Recent corrections</h2><ol></ol></section>
  <h2>Uncertain readings (${unsure.length})</h2>
  <ul class="proof">${unsure.map(([slug, id, t, src]) => `<li${src ? ` data-src="${src}"` : ''}><a href="${slug}.html#${id}">${sections.get(slug)?.title ?? extraTitles[slug]}</a> ${escapeHtml(t.slice(0, 220))}</li>`).join('')}</ul>
  <h2>Unmatched references (${Object.values(rejected).flat().length})</h2>
  <ul class="proof">${Object.entries(rejected).map(([slug, rs]) => `<li><a href="${slug}.html">${sections.get(slug)?.title ?? extraTitles[slug] ?? slug}</a> ${rs.map((r) => `<code>${escapeHtml(r)}</code>`).join(' ')}</li>`).join('')}</ul>
</article>`;
fs.writeFileSync(path.join(OUT, 'proofing.html'), layout({ title: 'Proofing List', body: proofBody, bodyClass: 'proofing', withToc: false }));

// ---------- Data + assets ----------
const titles = { ...Object.fromEntries(order.map((s) => [s, sections.get(s).title])), ...extraTitles };
fs.writeFileSync(path.join(OUT, 'search-index.json'), JSON.stringify({ titles, docs: searchDocs }));
fs.writeFileSync(path.join(OUT, 'backlinks.json'), JSON.stringify({ titles, refs: backlinks, annotated: { Gen: genChapters } }));
for (const f of ['site.css', 'site.js']) fs.copyFileSync(path.join(ROOT, 'assets', f), path.join(OUT, f));

console.log(`genesis chapters: ${genChapters.length}  sections: ${order.length}  refs linked: ${totalRefs}  uncertain: ${unsure.length}  unmatched: ${Object.values(rejected).flat().length}`);
for (const [slug, rs] of Object.entries(rejected)) console.log(`  unmatched in ${slug}: ${rs.slice(0, 8).join(' | ')}${rs.length > 8 ? ' …' : ''}`);
