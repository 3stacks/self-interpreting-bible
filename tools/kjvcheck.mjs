// Compare the scripture-text lines of Genesis page transcriptions against the KJV.
// Usage: node tools/kjvcheck.mjs transcription/genesis/pdf214.md [...]
// Prints verses whose words differ from the KJV. Print and KJV editions do differ
// in places (spelling, punctuation); a reported difference means "look at the scan again".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const kjv = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kjv-src.json'), 'utf8').replace(/^﻿/, ''));
// transcription/<book>/ picks the KJV book: the folder is the book name in lower case with
// hyphens ("1-samuel", "song-of-solomon"). Loose pdfNNN.md files stay on Genesis.
const BOOK_AT = Object.fromEntries(kjv.map((b, i) => [b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), i]));
const chaptersFor = (file) => {
  const m = file.replace(/\\/g, '/').match(/transcription\/([a-z0-9-]+)\//);
  return kjv[BOOK_AT[m?.[1]] ?? 0].chapters;
};
const words = (s) => s.replace(/\^[a-z0-9*†‡§]+/gi, ' ').replace(/[¶*_]/g, ' ').replace(/\{[^}]*\}/g, ' ')
  .toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').split(/\s+/).filter(Boolean);

let bad = 0, checked = 0;
for (const file of process.argv.slice(2)) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/<!-- text -->([\s\S]*?)(?=<!-- (?:margin|notes|chapter: \d+) -->|$)/g) || [];
  const lines = m.join('\n').split('\n').map((l) => l.trim()).filter((l) => /^\d+:\d+\+? /.test(l));
  for (const line of lines) {
    const [, c, v, cont, rest] = line.match(/^(\d+):(\d+)(\+)? (.*)$/);
    const more = /\s>>$/.test(rest);
    const got = words(rest.replace(/\s>>$/, ''));
    const want = words(chaptersFor(file)[c - 1]?.[v - 1] ?? '');
    checked++;
    if (!want.length) { console.log(`${path.basename(file)} ${c}:${v}  no such verse in the KJV`); bad++; continue; }
    const W = want.join(' '), G = got.join(' ');
    const ok = cont && more ? W.includes(G) : cont ? W.endsWith(G) : more ? W.startsWith(G) : W === G;
    if (ok) continue;
    bad++;
    // Show the first point of divergence.
    let i = 0;
    const base = cont ? want.slice(want.length - got.length) : want;
    while (i < got.length && got[i] === base[i]) i++;
    console.log(`${path.basename(file)} ${c}:${v}${cont ? '+' : ''}${more ? ' >>' : ''}  at word ${i + 1}\n   yours: …${got.slice(Math.max(0, i - 4), i + 6).join(' ')}\n   KJV:   …${base.slice(Math.max(0, i - 4), i + 6).join(' ')}`);
  }
}
console.log(`${checked} verse lines checked, ${bad} differ from the KJV.`);
