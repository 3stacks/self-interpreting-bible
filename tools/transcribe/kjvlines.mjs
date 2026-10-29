// Append KJV verse lines ("C:V text") for a verse range to a file, so an agent can start a page's
// text block from the KJV and then only edit in keys, italics and printed variants.
// The KJV source carries marginal glosses in {braces}; they are dropped.
// Usage: node kjvlines.mjs <book abbrev, e.g. dt js jz> <out-file> <from C:V> <to C:V>
import fs from 'node:fs';
const [book, out, from, to] = process.argv.slice(2);
const kjv = JSON.parse(fs.readFileSync(new URL('../../data/kjv-src.json', import.meta.url), 'utf8').replace(/^﻿/, ''));
const chapters = kjv.find((b) => b.abbrev === book)?.chapters;
if (!chapters) { console.error(`unknown book ${book}; use one of ${kjv.map((b) => b.abbrev).join(' ')}`); process.exit(1); }
const [c1, v1] = from.split(':').map(Number), [c2, v2] = to.split(':').map(Number);
const lines = [];
for (let c = c1; c <= c2; c++) {
  const verses = chapters[c - 1];
  for (let v = c === c1 ? v1 : 1; v <= (c === c2 ? v2 : verses.length); v++) {
    lines.push(`${c}:${v} ${verses[v - 1].replace(/\s*\{[^}]*\}/g, '')}`);
  }
}
fs.appendFileSync(out, lines.join('\n') + '\n');
console.log(`appended ${lines.length} verse lines (${book} ${from} to ${to}) to ${out}`);
