// Builds the static site in ./build from the page transcriptions in ./transcription.
//   node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { marked } from 'marked';
import { BOOKS, BOOK_NAME } from './lib/books.mjs';
import { makeLinker } from './lib/refs.mjs';
import { PARTS } from './lib/contents.mjs';
import { VOLUMES } from './lib/volumes.mjs';
import { renderGenealogyChart } from './lib/genealogy.mjs';
import { parseBook, toRoman } from './lib/genesis.mjs';
import { ANNOTATED } from './lib/annotated.mjs';
import { ANALYTICS_LOADER } from './tools/analytics-loader.mjs';
import { annotateMeasures, annotateMeasuresPage, CONVERSION_NOTE, PAGE_CONVERSION_NOTE } from './lib/measures.mjs';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'build');
const VOLUME = { n: 1, roman: 'I', pdfToPrinted: (p) => p - 3 };
const ROMAN = ['', 'I', 'II', 'III', 'IV'];
// Volume I scans live in scans/, later volumes in scans/vN/, so PDF page numbers never collide.
const scanDir = (vol) => (vol > 1 ? `scans/v${vol}` : 'scans');
const pad3 = (n) => String(n).padStart(3, '0');

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
// Section pages of Volumes I to III live in transcription/. Volume IV section pages live in transcription/v4/,
// because their PDF page numbers repeat those of Volume I.
const sectionFiles = (sub) => fs.existsSync(path.join(ROOT, 'transcription', sub))
  ? fs.readdirSync(path.join(ROOT, 'transcription', sub)).filter((f) => /^pdf\d{3}\.md$/.test(f)).sort().map((f) => (sub ? `${sub}/${f}` : f))
  : [];
const files = [...sectionFiles(''), ...sectionFiles('v4')];
const sections = new Map(); // slug → { slug, title, pages: [], md: '' }
const order = [];
for (const f of files) {
  const pdf = +path.basename(f).slice(3, 6);
  const text = fs.readFileSync(path.join(ROOT, 'transcription', f), 'utf8');
  const marks = [...text.matchAll(/<!--\s*(section|continued):\s*([a-z0-9-]+)\s*-->/g)];
  const vol = +(text.match(/<!--\s*volume:\s*(\d+)\s*-->/)?.[1] || (f.startsWith('v4/') ? 4 : 1));
  // Front matter of Volume IV is numbered in Roman numerals ("printed: vii"). Keep those as written.
  const printedNum = text.match(/<!--\s*page:\s*\d+\s+printed:\s*(\d+|[ivxlc]+)\b/)?.[1];
  const printed = printedNum ? (/^\d+$/.test(printedNum) ? +printedNum : printedNum) : (vol === 1 ? pdf - 3 : null);
  marks.forEach((mk, i) => {
    const [, kind, slug] = mk;
    const from = mk.index + mk[0].length;
    const raw = text.slice(from, marks[i + 1]?.index ?? text.length);
    let s = sections.get(slug);
    if (!s) {
      s = { slug, title: slug, pages: [], pageMeta: {}, plates: [], md: '' };
      sections.set(slug, s);
      order.push(slug);
    }
    const h = raw.match(/^#\s+(.+)$/m);
    if (h && (kind === 'section' || s.title === slug)) s.title = h[1].trim().replace(/[,:;.]+$/, '');
    if (!s.pages.includes(pdf)) s.pages.push(pdf);
    s.pageMeta[pdf] = { vol, printed };
    const ill = raw.match(/<!--\s*illustration:\s*([\s\S]*?)-->/);
    const prose = raw.replace(/<!--[\s\S]*?-->/g, '').replace(/^#\s+.+$/m, '').trim();
    if (ill && !prose) {
      s.plates.push({ pdf, caption: ill[1].replace(/\s+/g, ' ').trim() });
      s.md += `\n\n<div class="page-break" data-pdf="${pdf}" data-plate="1"></div>\n\n`;
    } else {
      let body = markSource(raw, f, text.slice(0, from).split('\n').length).replace(/^#\s+.+$/m, '');
      const marker = `\n\n<div class="page-break" data-pdf="${pdf}"></div>\n\n`;
      // A paragraph that runs over the page edge: the new page starts in lower case. Join it to the
      // last paragraph of the page before (dropping a split-word hyphen), and set the page marker after it.
      const lead = body.replace(/^(\s*<!--[\s\S]*?-->)*\s*/, '');
      const prev = s.md.trimEnd().match(/^([\s\S]*\S)((?:\s*⟦[^⟧]+⟧)+)$/);
      const lastLine = prev?.[1].split('\n').pop() ?? '';
      if (kind === 'continued' && /^[a-z]/.test(lead) && prev && !/^(\||#|<|[-*]\s|\d+\.\s)/.test(lastLine.trim())) {
        const cut = lead.search(/\n\s*\n/);
        const first = cut < 0 ? lead : lead.slice(0, cut);
        const rest = cut < 0 ? '' : lead.slice(cut);
        const joined = /[A-Za-z]-$/.test(prev[1]) ? prev[1].slice(0, -1) + first : `${prev[1]} ${first}`;
        s.md = joined + prev[2] + marker + rest;
      } else {
        s.md += marker + body;
      }
    }
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

// ---------- Annotated books (Genesis, Exodus, …), with Brown's text, margin and notes ----------
const books = [];
for (const meta of ANNOTATED) {
  const dir = path.join(ROOT, 'transcription', meta.dir);
  if (!fs.existsSync(dir)) continue;
  const parsed = parseBook(dir);
  if (!parsed.pages.length) continue;
  const chapters = [...parsed.chapters.keys()].filter((n) => parsed.chapters.get(n).verses.size).sort((a, b) => a - b);
  books.push({ meta, parsed, chapters, vol: meta.volume ?? 1 });
}
const printedOf = (book, pdf) => book.parsed.printed[pdf] ?? (book.vol === 1 ? VOLUME.pdfToPrinted(pdf) : '?');

// ImageMagick's `convert` is not on every machine. Python/Pillow does the same rotates.
function hasConvert() {
  try { execFileSync('convert', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; }
}
const USE_CONVERT = hasConvert();
function convertImage(src, dst, { rotate = 0, trim = false, resize = null, quality = 80 } = {}) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (USE_CONVERT) {
    const args = [src];
    if (rotate) args.push('-rotate', String(rotate));
    if (trim) args.push('-trim');
    if (resize) args.push('-resize', resize);
    if (/\.jpe?g$/.test(dst)) args.push('-quality', String(quality));
    args.push(dst);
    execFileSync('convert', args);
    return;
  }
  const script = `
from PIL import Image, ImageChops
im = Image.open(${JSON.stringify(src)})
if im.mode not in ("RGB", "L"):
    im = im.convert("L")
rot = ${rotate}
if rot % 360:
    im = im.rotate(-rot, expand=True)
if ${trim ? "True" : "False"}:
    bg = Image.new(im.mode, im.size, 255 if im.mode == "L" else (255, 255, 255))
    bbox = ImageChops.difference(im, bg).getbbox()
    if bbox:
        im = im.crop(bbox)
spec = ${resize ? JSON.stringify(resize) : "None"}
if spec:
    m = int(spec.rstrip("x"))
    w, h = im.size
    if w >= h:
        im = im.resize((m, max(1, round(h * m / w))), Image.Resampling.LANCZOS)
    else:
        im = im.resize((max(1, round(w * m / h)), m), Image.Resampling.LANCZOS)
out = ${JSON.stringify(dst)}
if out.endswith(".jpg") or out.endswith(".jpeg"):
    im.convert("L").save(out, quality=${quality})
else:
    im.save(out)
`;
  execFileSync('python3.12', ['-c', script]);
}

// ---------- Scans (stored upside down in the PDF; turn them upright for the web) ----------
const scanPages = new Set();
for (const s of sections.values()) for (const pdf of s.pages) scanPages.add(`${s.pageMeta[pdf]?.vol ?? 1}:${pdf}`);
for (const book of books) for (const pdf of book.parsed.pages) scanPages.add(`${book.vol}:${pdf}`);
for (const key of scanPages) {
  const [vol, pdf] = key.split(':').map(Number);
  const src = path.join(ROOT, scanDir(vol), `pdf${pad3(pdf)}.png`);
  const dst = path.join(OUT, scanDir(vol), `pdf${pad3(pdf)}.png`);
  if (fs.existsSync(src) && !fs.existsSync(dst)) convertImage(src, dst, { rotate: 180 });
}
// Most plates are printed sideways with the caption up the right edge; turn those upright.
const UPRIGHT_PLATES = new Set([253, 255]);
function writePlateImages(vol, pdf) {
  const dir = path.join(OUT, scanDir(vol));
  const src = path.join(dir, `pdf${pad3(pdf)}.png`);
  const thumb = path.join(dir, `thumb-pdf${pdf}.jpg`);
  const big = path.join(dir, `plate-pdf${pdf}.jpg`);
  const rotate = vol === 1 && UPRIGHT_PLATES.has(pdf) ? 0 : 90;
  if (!fs.existsSync(thumb)) convertImage(src, thumb, { rotate, trim: true, resize: '1000x', quality: 78 });
  if (!fs.existsSync(big)) convertImage(src, big, { rotate, trim: true, resize: '2400x', quality: 82 });
}
for (const book of books) for (const { pdf } of book.parsed.plates) writePlateImages(book.vol, pdf);
for (const s of sections.values()) for (const pl of s.plates) writePlateImages(s.pageMeta[pl.pdf]?.vol ?? 1, pl.pdf);

// ---------- Rendering ----------
const rejected = {}; // slug → refs that looked like scripture but didn't validate
let currentSlug = '';
const annotatedHref = Object.fromEntries(books.map((b) => [b.meta.code, { slug: b.meta.slug, chapters: new Set(b.chapters) }]));
const linker = makeLinker(kjv, (r) => (rejected[currentSlug] ??= []).push(r), annotatedHref);
const backlinks = {}; // "Gen.10" → [{slug, id}]
const searchDocs = [];
const unsure = [];

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Drop caps and small capitals are stored as one span. Put that span back after escaping.
const restoreSmallCaps = (s) => s.replace(/&lt;span class="sc"&gt;([\s\S]*?)&lt;\/span&gt;/g, '<span class="sc">$1</span>');
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const slugify = (s) => stripTags(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const GLOSSARIES = new Set(['obsolete-words', 'glossary-of-symbolic-words', 'precious-stones', 'trees-and-plants', 'mountains-and-hills', 'rivers-lakes-seas']);

function renderSection(s) {
  currentSlug = s.slug;
  // The metrical Psalms keep one printed line as one row. A single newline becomes a break.
  let html = marked.parse(s.md, { gfm: true, breaks: s.slug === 'metrical-psalms' });
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
  html = html.replace(/\{([0-9]{1,2})\}/g, '<sup class="fn">$1</sup>');
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

  if (s.slug === 'measures-weights-coins') html = annotateMeasuresPage(html);
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  html = html.replace(/<div class="page-break" data-pdf="(\d+)"( data-plate="1")?><\/div>/g, (m, pdf, plate) => {
    const marker = pageMarker(+pdf, s);
    if (!plate) return marker;
    const pl = s.plates.find((p) => p.pdf === +pdf);
    return pl ? marker + plateFigure(s.pageMeta[pl.pdf]?.vol ?? 1, pl) : marker;
  });

  if (s.slug === 'genealogy-of-the-patriarchs') html = renderGenealogyChart(s.md) + html;
  if (GLOSSARIES.has(s.slug)) html = letterIndex(html) ;
  return html;
}

function plateFigure(vol, pl) {
  const cut = pl.caption.search(/\]\s*[—.-]*/);
  const title = cut > 0 ? pl.caption.slice(0, pl.caption.indexOf(']', cut) + 1) : pl.caption.split(/(?<=\.)\s/)[0];
  const rest = pl.caption.slice(title.length).replace(/^[\s—.-]+/, '');
  return `<figure class="plate"><button type="button" class="scan-btn plate-btn" data-scan="${scanDir(vol)}/plate-pdf${pl.pdf}.jpg" data-label="${escapeHtml(title)}" aria-label="Enlarge: ${escapeHtml(title)}"><img src="${scanDir(vol)}/thumb-pdf${pl.pdf}.jpg" alt="${escapeHtml(title)}" loading="lazy"></button><figcaption><b>${escapeHtml(title)}</b>${rest ? ` ${escapeHtml(rest)}` : ''}</figcaption></figure>`;
}

function pageMarker(pdf, s) {
  const meta = s.pageMeta?.[pdf] ?? { vol: 1, printed: VOLUME.pdfToPrinted(pdf) };
  const first = s.pages[0] === pdf;
  const roman = ROMAN[meta.vol] || VOLUME.roman;
  const label = meta.printed ? `Vol. ${roman}, p. ${meta.printed}` : `Vol. ${roman}, plate`;
  const id = meta.printed ? ` id="p${meta.printed}"` : '';
  return `<div class="page-marker${first ? ' first' : ''}"${id}>
  <span>${first ? 'Begins' : 'Continues'} on ${label}</span>
  <button type="button" class="scan-btn" data-scan="${scanDir(meta.vol)}/pdf${pad3(pdf)}.png" data-label="${label}">View page scan</button>
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
const sectionVol = (slug) => sections.get(slug).pageMeta?.[sections.get(slug).pages[0]]?.vol ?? 1;
const other = order.filter((s) => !partOf[s] && sectionVol(s) === 1);
const laterSections = order.filter((s) => !partOf[s] && sectionVol(s) > 1);
const parts = [...PARTS, ...(other.length ? [{ title: 'Other Tables', blurb: '', slugs: other }] : [])];

function tocLinks(slugs, active) {
  return slugs.filter((s) => sections.has(s))
    .map((s) => `<li><a href="${s}.html"${s === active ? ' aria-current="page"' : ''}>${sections.get(s).title}</a></li>`)
    .join('');
}

function sidebar(active) {
  const jump = `<div class="toc-part"><p class="toc-head">Volumes</p><ul>
    <li><a href="index.html#volume-1">Volume I</a></li>
    <li><a href="index.html#before-genesis">Before Genesis</a></li>
    <li><a href="index.html#volume-2">Volume II</a></li>
    <li><a href="index.html#volume-3">Volume III</a></li>
    <li><a href="index.html#volume-4">Volume IV</a></li>
  </ul></div>`;
  const groups = parts.map((p) => {
    const body = p.groups
      ? p.groups.map((g) => {
        const items = tocLinks(g.slugs, active);
        return items ? `<p class="toc-sub">${g.title}</p><ul>${items}</ul>` : '';
      }).join('')
      : `<ul>${tocLinks(p.slugs, active)}</ul>`;
    if (!body.includes('<li>')) return '';
    return `<div class="toc-part"><p class="toc-head">${p.title}</p>${body}</div>`;
  }).join('');
  return jump + groups;
}

function layout({ title, body, active = '', bodyClass = '', withToc = true, toc = null, head = '' }) {
  return `<!doctype html>
<html lang="en-GB" data-era="am"${REPO ? ` data-repo="${REPO}" data-branch="${BRANCH}"` : ''}>
<head>
<meta charset="utf-8">
<script id="analytics">${ANALYTICS_LOADER}</script>
<script>try{if(localStorage.getItem("sib:era")==="bc")document.documentElement.dataset.era="bc"}catch(e){}</script>
${head}
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
      <a href="https://ko-fi.com/lukeboyle">Ko-fi</a>
      ${PROOFING ? `<a href="proofing.html">Proofing</a>
      <button type="button" id="edit-toggle" class="edit-toggle" aria-pressed="false" hidden title="Show a ✎ on every passage, to correct the transcription">Edit</button>` : ''}
      <span class="era-toggle" role="group" aria-label="Show years as"><button type="button" data-era="am" aria-pressed="true" title="Anno Mundi (A.M.). Years from the Creation.">A.M.</button><button type="button" data-era="bc" aria-pressed="false" title="Before Christ (B.C.). The years the book prints.">B.C.</button></span>
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
${PROOFING ? `<dialog class="fix-dialog" id="fix-dialog">
  <form id="fix-form" method="dialog">
    <h2>Correct the transcription</h2>
    <p class="fix-current" id="fix-current"></p>
    <p class="fix-help">Edit the source text below to match the printed page. Keep the markers as they are: <code>{a}</code> keys, <code>*italics*</code>, <code>[?]</code> for a doubtful reading (remove it once settled).</p>
    <div id="fix-parts"></div>
    <label class="fix-note">Note (optional) <input id="fix-note" type="text" placeholder="e.g. checked against the scan"></label>
    <div class="fix-actions"><span id="fix-status" aria-live="polite"></span><button type="button" id="fix-cancel">Cancel</button><button type="submit" id="fix-save">Save correction</button></div>
  </form>
</dialog>` : ''}
<script src="site.js"></script>
</body>
</html>
`;
}
const SITE = 'The Self-Interpreting Bible';
// Where the transcriptions live on GitHub, for "correct this" links on a static host.
// In GitHub Actions these come from the run; locally from site.config.json if present.
const CONFIG = fs.existsSync(path.join(ROOT, 'site.config.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8')) : {};
// The proofing tools (the Proofing list, Edit mode and the ✎ buttons) are for local work only.
// serve.mjs builds with SIB_PROOFING=1. A plain build, such as the deploy build, leaves them out.
const PROOFING = process.env.SIB_PROOFING === '1';

// ---------- Catechize ----------
// data/catechize-cited.json maps each verse to the catechism and confession answers that cite it
// as a proof text (tools/fetch-catechize.mjs). Each verse links to those answers in Catechize.
const CATECHIZE = process.env.CATECHIZE_URL ?? 'https://catechize.pages.dev';
const citedPath = path.join(ROOT, 'data/catechize-cited.json');
const cited = fs.existsSync(citedPath) ? JSON.parse(fs.readFileSync(citedPath, 'utf8')) : { units: {}, verses: {} };
function citedHtml(key) {
  const ids = cited.verses[key];
  if (!ids?.length) return '';
  const byDoc = new Map(); // doc short name → links, in Catechize's document order
  for (const id of ids) {
    const [doc, label] = cited.units[id];
    const sp = label.indexOf(' ');
    const short = label.slice(0, sp);
    const link = `<a href="${CATECHIZE}/app/#/unit/${doc}/${encodeURIComponent(id)}" title="Open ${escapeHtml(label)} in Catechize">${escapeHtml(label.slice(sp + 1))}</a>`;
    (byDoc.get(short) ?? byDoc.set(short, []).get(short)).push(link);
  }
  const groups = [...byDoc].map(([short, links]) => `${short} ${links.join(', ')}`).join(' · ');
  return `<span class="cited"><span class="cited-label">Cited in</span> ${groups}</span>`;
}
const REPO = PROOFING ? process.env.GITHUB_REPOSITORY || CONFIG.repo || '' : '';
const BRANCH = process.env.GITHUB_REF_NAME || CONFIG.branch || 'main';

// ---------- Section pages ----------
const rendered = new Map();
for (const slug of order) rendered.set(slug, renderSection(sections.get(slug)));

contentsOrder.forEach((slug, i) => {
  const s = sections.get(slug);
  const prev = contentsOrder[i - 1], next = contentsOrder[i + 1];
  const part = partOf[slug];
  const printed = s.pages.map((pdf) => s.pageMeta?.[pdf]?.printed).filter((n) => n);
  const pageRange = printed.length > 1 ? `pp. ${printed[0]}–${printed.at(-1)}` : `p. ${printed[0]}`;
  const body = `
<article class="section${GLOSSARIES.has(slug) ? ' glossary' : ''}" data-slug="${slug}">
  <p class="eyebrow">${part ? part.title : 'Comprehensive Aids'}</p>
  <h1>${s.title}</h1>
  <p class="source">Blackwood’s Comprehensive Aids to the Study of the Bible · Vol. ${VOLUME.roman}, ${pageRange}</p>
  ${rendered.get(slug).includes('class="conv') ? '<div class="chapter-tools"><label><input type="checkbox" id="show-conv" checked> Modern measures</label></div>' : ''}
  ${rendered.get(slug)}
  ${rendered.get(slug).includes('class="conv') ? `<p class="conv-note">${slug === 'measures-weights-coins' ? PAGE_CONVERSION_NOTE : CONVERSION_NOTE}</p>` : ''}
  <nav class="pager" aria-label="Previous and next">
    ${prev ? `<a class="prev" href="${prev}.html"><span>Previous</span>${sections.get(prev).title}</a>` : '<span></span>'}
    ${next ? `<a class="next" href="${next}.html"><span>Next</span>${sections.get(next).title}</a>` : '<span></span>'}
  </nav>
</article>`;
  fs.writeFileSync(path.join(OUT, `${slug}.html`), layout({ title: s.title, body, active: slug }));
});

for (const slug of laterSections) {
  const s = sections.get(slug);
  const vol = sectionVol(slug);
  const printed = s.pages.map((pdf) => s.pageMeta?.[pdf]?.printed).filter((n) => n);
  const pageRange = printed.length > 1 ? `pp. ${printed[0]}–${printed.at(-1)}` : printed.length ? `p. ${printed[0]}` : 'plate';
  const body = `
<article class="section" data-slug="${slug}">
  <p class="eyebrow">Volume ${ROMAN[vol]}</p>
  <h1>${s.title}</h1>
  <p class="source">Vol. ${ROMAN[vol]}, ${pageRange}</p>
  ${rendered.get(slug)}
  <nav class="pager" aria-label="Previous and next">
    <a class="prev" href="index.html#volume-${vol}"><span>Previous</span>Volume ${ROMAN[vol]}</a>
    <span></span>
  </nav>
</article>`;
  fs.writeFileSync(path.join(OUT, `${slug}.html`), layout({ title: s.title, body, toc: annotatedToc(slug, 0) }));
}

// ---------- Genesis pages ----------
const extraTitles = {}; // slug → title, for search, backlinks and proofing
const inline = (md) => marked.parseInline(md, { gfm: true })
  .replace(/\[\?\]/g, '<span class="unsure" title="Uncertain reading of the scan">?</span>')
  .replace(/\[illegible\]/g, '<span class="unsure illegible" title="Unreadable in the scan">illegible</span>');

function chapterCells(book, activeChapter) {
  const cells = [];
  const start = book.meta.chapterStart ?? 1;
  for (let n = start; n <= book.meta.chapters; n++) {
    const on = activeChapter === n;
    cells.push(book.parsed.chapters.get(n)?.verses.size
      ? `<a href="${book.meta.slug}-${n}.html"${on ? ' aria-current="page"' : ''}>${n}</a>`
      : `<span>${n}</span>`);
  }
  return cells.join('');
}

function bookToc(book, activeSlug, activeChapter) {
  const onBook = book.meta.slug === activeSlug;
  return `<div class="toc-part"><p class="toc-head"><a href="${book.meta.slug}.html"${onBook && activeChapter === 0 ? ' aria-current="page"' : ''}>${book.meta.name}</a></p><div class="ch-grid">${chapterCells(book, onBook ? activeChapter : 0)}</div></div>`;
}

function annotatedToc(activeSlug, activeChapter) {
  const bySlug = Object.fromEntries(books.map((b) => [b.meta.slug, b]));
  const present = new Set(books.map((b) => b.vol));
  const listed = new Set();
  const parts = [];
  for (const vol of VOLUMES) {
    const v = ROMAN.indexOf(vol.roman);
    if (!present.has(v)) continue;
    const main = (vol.books || []).map((item) => {
      const book = item.slug && bySlug[item.slug];
      if (!book) return '';
      listed.add(item.slug);
      return bookToc(book, activeSlug, activeChapter);
    }).join('\n');
    const extra = (vol.extras || []).map((g) => {
      const items = g.books.map((item) => {
        if (item.section && sections.has(item.section)) {
          const on = item.section === activeSlug;
          return `<div class="toc-part"><p class="toc-head"><a href="${item.section}.html"${on ? ' aria-current="page"' : ''}>${item.name}</a></p></div>`;
        }
        const book = item.slug && bySlug[item.slug];
        if (!book) return '';
        listed.add(item.slug);
        return bookToc(book, activeSlug, activeChapter);
      }).join('\n');
      if (!items.trim()) return '';
      return `<div class="toc-part"><p class="toc-head">${g.title}</p></div>\n${items}`;
    }).join('\n');
    const rest = books.filter((b) => b.vol === v && !listed.has(b.meta.slug)).map((b) => bookToc(b, activeSlug, activeChapter)).join('\n');
    const aids = v === 1 ? '\n<div class="toc-part"><p class="toc-head"><a href="index.html#before-genesis">Before Genesis</a></p></div>' : '';
    const head = `<div class="toc-part"><p class="toc-head">Volume ${vol.roman}</p></div>`;
    parts.push(vol.extrasFirst ? `${head}\n${extra}\n${main}${aids}\n${rest}` : `${head}\n${main}${aids}\n${rest}\n${extra}`);
  }
  const next = Math.max(...present, 0) + 1;
  if (next <= 4) parts.push(`<div class="toc-part"><p class="toc-head"><a href="index.html#volume-${next}">${next < 4 ? `Volumes ${ROMAN[next]} to IV` : 'Volume IV'}</a></p></div>`);
  return parts.join('\n');
}

function marginDate(d) {
  const am = d.match(/A\.\s?M\.\s*\d+\.?/), bc = d.match(/B\.\s?C\.\s*\d+\.?/);
  if (am && bc) return `<p class="mdate has-am"><span class="d-am">${am[0]}</span> <span class="d-bc">${bc[0]}</span></p>`;
  return `<p class="mdate">${escapeHtml(d)}</p>`;
}

function renderAnnotatedChapter(book, n) {
  const ch = book.parsed.chapters.get(n);
  const slug = `${book.meta.slug}-${n}`;
  currentSlug = slug;
  const chName = book.meta.chapterName ?? book.meta.name; // "Psalm 23", not "Psalms 23"
  const title = `${chName} ${n}`;
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
    // A footnote in Brown's notes is keyed "{1}" in the note and again at the start of its own paragraph.
    let html = linker.linkHtml(inline(note.text)).replace(/\{([0-9*†‡§]{1,2})\}/g, '<sup class="fn">$1</sup>');
    const id = `n${n}-${i + 1}`;
    const ver = note.text.match(/^\[?Ver\.\s*(\d+)/);
    if (ver) {
      const v = +ver[1];
      if (!noted.has(v)) noted.set(v, id);
      html = html.replace(/^(\[?)(Ver\.\s*[\d,\s\-–]+\.)/, (m, b, t) => b + `<a class="ver" href="#v${n}-${v}">${t}</a>`);
    }
    const refl = /^\*\*Reflections\.\*\*/.test(note.text);
    record(id, html, note.src);
    return `<p id="${id}"${refl ? ' class="reflections"' : ''}${srcAttr(note.src)}>${annotateMeasures(html)}</p>`;
  });

  let pdfSeen = new Set();
  const lastKeyId = {}; // key → margin entry id, for a key printed again in a later verse
  const verses = [...ch.verses.values()].sort((a, b) => a.v - b.v).map((vs) => {
    const vid = `v${n}-${vs.v}`;
    const keysSeen = {};
    // A pilcrow in Ecclesiasticus is a margin key. Elsewhere it only marks a paragraph.
    const hasPilcrowKey = vs.margin.some((e) => e.key === '¶');
    let pilcrowLinked = false;
    const text = restoreSmallCaps(escapeHtml(vs.text))
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/¶\s*/g, (m) => {
        if (hasPilcrowKey && !pilcrowLinked) {
          pilcrowLinked = true;
          const k = '¶';
          keysSeen[k] = 1;
          const id = `m${n}-${vs.v}-${k}`;
          return `<sup class="key"><a href="#${id}">${k}</a></sup>${/\s/.test(m) ? ' ' : ''}`;
        }
        return '<span class="pilcrow" aria-hidden="true">¶</span> ';
      })
      .replace(/\{([a-z0-9*†‡§|]{1,3})\}|\^([a-z0-9*†‡§|]+)/gi, (m, k1, k2) => {
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
      const label = `Vol. ${ROMAN[book.vol]}, p. ${printedOf(book, vs.pdf)}`;
      marker = `<div class="page-marker"><span>${label}</span><button type="button" class="scan-btn" data-scan="${scanDir(book.vol)}/pdf${pad3(vs.pdf)}.png" data-label="${label}">View page scan</button></div>`;
    }
    const plates = book.parsed.plates.filter((pl) => pl.after?.c === n && pl.after?.v === vs.v).map((pl) => plateFigure(book.vol, pl)).join('');
    const heading = vs.heading ? `<h2 class="ch-section" id="s${n}-${vs.v}">${escapeHtml(vs.heading)}</h2>` : '';
    return `${marker}${heading}<div class="verse" id="${vid}"${srcAttr(vs.src)}><p class="vt">${num} ${annotateMeasures(text)}${citedHtml(`${book.meta.code}.${n}.${vs.v}`)}</p>${margin ? `<div class="vm">${margin}</div>` : ''}</div>${plates}`;
  });
  const loose = ch.margin.map((e) => `${e.date ? marginDate(e.date) : ''}<p class="ment"${srcAttr(e.src)}><b>${escapeHtml(e.key)}</b> ${linker.linkHtml(inline(e.text))}${e.v ? ` <span class="muted">(ver. ${e.v})</span>` : ''}</p>`).join('');

  const i = book.chapters.indexOf(n);
  const prev = book.chapters[i - 1], next = book.chapters[i + 1];
  const printed = ch.pages.map((pdf) => printedOf(book, pdf));
  const hasConv = verses.some((v) => v.includes('class="conv"')) || notes.some((p) => p.includes('class="conv"'));
  const body = `
<article class="section chapter" data-slug="${slug}" data-code="${book.meta.code}" data-chapter="${n}">
  <p class="eyebrow">${book.meta.eyebrow}</p>
  <h1>${chName} ${n}</h1>
  <p class="source">${book.meta.chapterName ?? 'Chapter'} ${toRoman(n)} · Vol. ${ROMAN[book.vol]}, ${printed.length > 1 ? `pp. ${printed[0]}–${printed.at(-1)}` : `p. ${printed[0]}`}</p>
  ${ch.summary ? `<p class="summary"${srcAttr(ch.summary.src)}>${linker.linkHtml(inline(ch.summary.text))}</p>` : ''}
  <div class="chapter-tools"><label><input type="checkbox" id="show-margin" checked> Margin references</label>${hasConv ? '<label><input type="checkbox" id="show-conv" checked> Modern measures</label>' : ''}${ch.notes.length ? `<a href="#notes">Notes ↓</a>` : ''}</div>
  ${ch.title ? `<p class="ps-title"${srcAttr(ch.title.src)}>${linker.linkHtml(inline(ch.title.text))
    // Keys in a psalm's title point at margin entries filed under verse 1.
    .replace(/\{([a-z0-9*†‡§|]{1,3})\}/gi, (m, k) => `<sup class="key"><a href="#m${n}-1-${k}">${k}</a></sup>`)}</p>` : ''}
  <div class="scripture">${verses.join('\n')}</div>
  ${loose ? `<aside class="loose-margin"><h2>Other margin entries</h2>${loose}</aside>` : ''}
  ${ch.notes.length ? `<section class="notes" id="notes"><h2>Notes</h2>${notes.join('\n')}</section>` : ''}
  ${hasConv ? `<p class="conv-note">${CONVERSION_NOTE}</p>` : ''}
  <nav class="pager" aria-label="Previous and next">
    ${prev ? `<a class="prev" href="${book.meta.slug}-${prev}.html"><span>Previous</span>${chName} ${prev}</a>` : `<a class="prev" href="${book.meta.slug}.html"><span>Previous</span>Introduction</a>`}
    ${next ? `<a class="next" href="${book.meta.slug}-${next}.html"><span>Next</span>${chName} ${next}</a>` : '<span></span>'}
  </nav>
</article>`;
  fs.writeFileSync(path.join(OUT, `${slug}.html`), layout({ title, body, toc: annotatedToc(book.meta.slug, n), bodyClass: 'annotated' }));
}

for (const book of books) {
  for (const n of book.chapters) renderAnnotatedChapter(book, n);
  extraTitles[book.meta.slug] = book.meta.name;
  const hasNotes = [...book.parsed.chapters.values()].some((ch) => ch.notes.length);
  const credit = hasNotes ? 'With John Brown’s marginal references, notes and reflections' : 'With the marginal references';
  const introBody = `
<article class="section">
  <p class="eyebrow">Volume ${ROMAN[book.vol]}</p>
  <h1>${escapeHtml(book.parsed.title || book.meta.name)}</h1>
  <p class="source">${credit} · Vol. ${ROMAN[book.vol]}, p. ${printedOf(book, book.parsed.pages[0])}</p>
  ${book.parsed.intro.map((p) => `<p${srcAttr(p.src)}>${linker.linkHtml(inline(p.text))}</p>`).join('\n')}
  <h2>Chapters</h2>
  <div class="ch-grid big">${chapterCells(book, 0)}</div>
</article>`;
  fs.writeFileSync(path.join(OUT, `${book.meta.slug}.html`), layout({ title: book.meta.name, body: introBody, toc: annotatedToc(book.meta.slug, 0) }));
}

// ---------- Contents ----------
const totalRefs = Object.values(backlinks).reduce((a, l) => a + l.length, 0);

function nameList(items, live) {
  return `<ul class="name-list">${items.map((b) => {
    if (b.section && sections.has(b.section)) return `<li><a href="${b.section}.html">${b.name}</a></li>`;
    const on = live && b.slug && books.some((book) => book.meta.slug === b.slug);
    return on
      ? `<li><a href="${b.slug}.html">${b.name}</a></li>`
      : `<li class="wait">${b.name}</li>`;
  }).join('')}</ul>`;
}

function aidLists(p) {
  const blocks = (p.groups || [{ title: '', slugs: p.slugs }]).map((g) => {
    const items = g.slugs.filter((s) => sections.has(s));
    if (!items.length) return '';
    const lis = items.map((s) => {
      const sec = sections.get(s);
      return `<li><a href="${s}.html">${sec.title}</a><span class="pg">${VOLUME.pdfToPrinted(sec.pages[0])}</span></li>`;
    }).join('');
    return `${g.title ? `<p class="group-label">${g.title}</p>` : ''}<ol>${lis}</ol>`;
  }).join('');
  if (!blocks.includes('<li>')) return '';
  return `<section class="part" id="${p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}">
  <h4>${p.title}</h4>
  ${p.blurb ? `<p class="part-blurb">${p.blurb}</p>` : ''}
  ${blocks}
</section>`;
}

function volumeBlock(vol) {
  const volN = ROMAN.indexOf(vol.roman);
  // Volume I opens with Blackwood's aids. Show them beside the books, so the contents page does not hide them below six chapter grids.
  if (vol.roman === 'I') {
    const blocks = books.filter((b) => b.vol === volN).map((book) => `<section class="book-block">
      <h4><a href="${book.meta.slug}.html">${book.meta.name}</a><span class="ch-count">${book.chapters.length} chapters</span></h4>
      <div class="ch-grid">${chapterCells(book, 0)}</div>
    </section>`).join('\n');
    return `<section class="volume vol-split" id="${vol.id}">
  <h2><span>Volume ${vol.roman}</span>${vol.span}</h2>
  <div class="split">
    <div class="split-text">
      <h3 id="${vol.id}-text">The text</h3>
      <p class="volume-note">Each book has its own introduction. Open the book name to read it.</p>
      ${blocks}
    </div>
    <aside class="split-aids" id="before-genesis" aria-labelledby="before-genesis-h">
      <h3 id="before-genesis-h">Before Genesis: Blackwood's aids</h3>
      <p class="volume-note">The printed volume opens with these histories, tables and essays. The groups follow the order of the printed volume.</p>
      <div class="aid-cols">
${parts.map(aidLists).join('\n')}
      </div>
    </aside>
  </div>
</section>`;
  }
  const listed = new Set((vol.books || []).map((b) => b.slug).filter(Boolean));
  const grids = books.filter((b) => b.vol === volN && listed.has(b.meta.slug)).map((book) => `<section class="book-block">
    <h4><a href="${book.meta.slug}.html">${book.meta.name}</a></h4>
    <div class="ch-grid big">${chapterCells(book, 0)}</div>
  </section>`).join('\n');
  const extras = (vol.extras || []).map((g) => {
    const blocks = g.books.map((item) => {
      const book = books.find((b) => b.meta.slug === item.slug);
      if (!book) return '';
      return `<section class="book-block">
    <h4><a href="${book.meta.slug}.html">${item.name}</a></h4>
    <div class="ch-grid big">${chapterCells(book, 0)}</div>
  </section>`;
    }).join('\n');
    return `<h3>${g.title}</h3>${nameList(g.books, true)}${blocks}`;
  }).join('\n');
  const bookHtml = `<h3 id="${vol.id}-text">The text</h3>
  ${nameList(vol.books, true)}
  ${grids}`;
  const absent = vol.books.some((b) => !(b.slug && books.some((book) => book.meta.slug === b.slug)));
  const note = absent
    ? `<p class="volume-note">${books.some((b) => b.vol === volN)
      ? 'If a name has no link, the site does not have that book yet.'
      : 'The site does not have this volume yet.'}</p>`
    : '';
  return `<section class="volume" id="${vol.id}">
  <h2><span>Volume ${vol.roman}</span>${vol.span}</h2>
  ${note}
  ${vol.extrasFirst ? extras : ''}
  ${bookHtml}
  ${vol.extrasFirst ? '' : extras}
</section>`;
}
const indexBody = `
<section class="hero">
  <p class="eyebrow">Four volumes</p>
  <h1>The Self-Interpreting Bible</h1>
  <p class="lede">This site gives the Self-Interpreting Bible of John Brown, with the text, the margin references, the notes and the reflections. Volume I opens with Blackwood's aids: histories of each period, tables of kings and prophecies, measures and money, and guides on how to read the Bible and pray.</p>
  <dl class="facts">
    <div><dt>Tables and essays</dt><dd>${contentsOrder.length}</dd></div>
    <div><dt>Pages transcribed</dt><dd>${(files.length + books.reduce((n, b) => n + b.parsed.pages.length, 0)).toLocaleString('en-GB')}</dd></div>
    <div><dt>Scripture references linked</dt><dd>${totalRefs.toLocaleString('en-GB')}</dd></div>
  </dl>
</section>
<div class="contents">
${VOLUMES.map((vol) => volumeBlock(vol)).join('\n')}
</div>
<p class="colophon">Scripture text: King James Version (1769). Transcriptions are a first pass from the scanned pages; question marks in the text flag uncertain readings.${PROOFING ? ' See the <a href="proofing.html">proofing list</a>.' : ''} <a href="https://ko-fi.com/lukeboyle">Support this work on Ko-fi</a>.</p>`;
const indexHtml = layout({ title: SITE, body: indexBody, bodyClass: 'home', withToc: false });
fs.writeFileSync(path.join(OUT, 'index.html'), indexHtml);
// The Artifact host supplies the document skeleton for the main page, so emit a bare-body copy.
fs.writeFileSync(
  path.join(ROOT, 'artifact-index.html'),
  indexHtml
    .replace(/^<!doctype html>\s*<html[^>]*>\s*<head>\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/, '')
    // The Artifact host has no /a/ proxy, so leave the analytics loader out.
    .replace(/<script id="analytics">[\s\S]*?<\/script>\s*/, '')
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
const annotatedJump = Object.fromEntries(books.map((b) => [b.meta.code, { slug: b.meta.slug, chapters: b.chapters }]));
const bibleHead = `<script id="annotated-chapters" type="application/json">${JSON.stringify(annotatedJump)}</script>
<script>try{var map=JSON.parse(document.getElementById("annotated-chapters").textContent);var raw=location.hash.slice(1)||localStorage.getItem("sib:last")||"Gen.1";var parts=decodeURIComponent(raw).split(".");var book=map[parts[0]];var ch=+parts[1]||1;if(book&&book.chapters.indexOf(ch)>=0){var v=+parts[2];location.replace(book.slug+"-"+ch+".html"+(v?"#v"+ch+"-"+v:""))}}catch(e){}</script>`;
fs.writeFileSync(path.join(OUT, 'bible.html'), layout({ title: 'Bible', body: bibleBody, bodyClass: 'bible', withToc: false, head: bibleHead }));

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
if (PROOFING) fs.writeFileSync(path.join(OUT, 'proofing.html'), layout({ title: 'Proofing List', body: proofBody, bodyClass: 'proofing', withToc: false }));

// ---------- Data + assets ----------
const titles = { ...Object.fromEntries(order.map((s) => [s, sections.get(s).title])), ...extraTitles };
fs.writeFileSync(path.join(OUT, 'search-index.json'), JSON.stringify({ titles, docs: searchDocs }));
const annotated = Object.fromEntries(books.map((b) => [b.meta.code, b.chapters]));
const annotatedSlug = Object.fromEntries(books.map((b) => [b.meta.code, b.meta.slug]));
fs.writeFileSync(path.join(OUT, 'backlinks.json'), JSON.stringify({ titles, refs: backlinks, annotated, annotatedSlug }));
for (const f of ['site.css', 'site.js']) fs.copyFileSync(path.join(ROOT, 'assets', f), path.join(OUT, f));

console.log(`books: ${books.map((b) => `${b.meta.name} ${b.chapters.length}`).join(', ') || 'none'}  sections: ${order.length}  refs linked: ${totalRefs}  uncertain: ${unsure.length}  unmatched: ${Object.values(rejected).flat().length}`);
for (const [slug, rs] of Object.entries(rejected)) console.log(`  unmatched in ${slug}: ${rs.slice(0, 8).join(' | ')}${rs.length > 8 ? ' …' : ''}`);
