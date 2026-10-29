// Check a transcribed book: every KJV verse present exactly once, and every "C:V+" continues a verse left open with " >>".
// Usage: node versecheck.mjs <transcription dir> <kjv abbrev>
import fs from 'node:fs';
const [dir, abbrev] = process.argv.slice(2);
const kjv = JSON.parse(fs.readFileSync(new URL('../../data/kjv-src.json', import.meta.url), 'utf8').replace(/^﻿/, '')).find((b) => b.abbrev === abbrev).chapters;
const seen = {}, issues = []; let prevOpen = null;
for (const f of fs.readdirSync(dir).filter((f) => /^pdf\d+\.md$/.test(f)).sort()) {
  let inText = false;
  for (const l of fs.readFileSync(`${dir}/${f}`, 'utf8').split('\n')) {
    if (/^<!-- (text|summary|margin|notes|chapter|intro)/.test(l)) { inText = l.startsWith('<!-- text'); continue; }
    const m = inText && l.match(/^(\d+):(\d+)(\+)? /); if (!m) continue;
    const k = `${m[1]}:${m[2]}`;
    if (m[3]) { if (prevOpen !== k) issues.push(`${f}: ${k}+ but the page before left ${prevOpen} open`); }
    else { if (seen[k]) issues.push(`${f}: ${k} also on ${seen[k]}`); seen[k] = f; }
    prevOpen = / >>\s*$/.test(l) ? k : null;
  }
}
const missing = []; kjv.forEach((vs, c) => vs.forEach((_, v) => { if (!seen[`${c + 1}:${v + 1}`]) missing.push(`${c + 1}:${v + 1}`); }));
console.log(`${Object.keys(seen).length} of ${kjv.flat().length} verses; missing: ${missing.join(' ') || 'none'}`);
if (issues.length) console.log(issues.join('\n'));
