// Update data/catechize-cited.json from Catechize: which catechism and confession answers cite
// each verse. The build links each verse to those answers.
//   node tools/fetch-catechize.mjs
// CI runs this before each build. If Catechize is not reachable, the build shows no citations.
import fs from 'node:fs';

const BASE = process.env.CATECHIZE_URL ?? 'https://catechize.pages.dev';
const OUT = new URL('../data/catechize-cited.json', import.meta.url);

try {
  const r = await fetch(`${BASE}/app/data/cited.json`, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const data = await r.json();
  if (!data.verses || !data.units) throw new Error('unexpected shape');
  fs.writeFileSync(OUT, JSON.stringify(data));
  console.log(`catechize-cited.json: ${Object.keys(data.verses).length} verses`);
} catch (e) {
  console.warn(`catechize-cited.json not updated (${e.message}).`);
}
