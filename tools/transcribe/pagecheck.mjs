// Flag page files whose text, margin or notes block is missing or empty (a sign of a cut-off agent).
// Plates (an illustration comment and no text block) are skipped.
// Usage: node pagecheck.mjs <folder>...
import fs from 'node:fs';
for (const dir of process.argv.slice(2)) {
  for (const f of fs.readdirSync(dir).filter((f) => /^pdf\d+\.md$/.test(f)).sort()) {
    const src = fs.readFileSync(`${dir}/${f}`, 'utf8');
    if (!/<!--\s*text\s*-->/.test(src)) continue;
    const empty = [];
    for (const kind of ['text', 'margin', 'notes']) {
      // A page can have several blocks of one kind (a text block per chapter); one with content is enough.
      const blocks = [...src.matchAll(new RegExp(`<!--\\s*${kind}\\s*-->([\\s\\S]*?)(?=<!--\\s*(?:text|margin|notes|summary|intro)\\s*-->|<!--\\s*chapter:|$)`, 'g'))];
      const body = blocks.map((m) => m[1].replace(/<!--[\s\S]*?-->/g, '').trim()).join('');
      if (!body) empty.push(kind);
    }
    if (empty.length) console.log(`${dir}/${f}: empty ${empty.join(', ')}`);
  }
}
