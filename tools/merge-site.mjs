// Put the built homepage (site/out/) over the built reader (build/), then write sitemap.xml and robots.txt.
//   node build.mjs && npm --prefix site run build && node tools/merge-site.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const BUILD = path.join(ROOT, 'build');
const OUT = path.join(ROOT, 'site', 'out');
const SITE_URL = (process.env.SITE_URL ?? 'https://haddingtonbible.org').replace(/\/+$/, '');

if (!fs.existsSync(path.join(BUILD, 'contents.html'))) throw new Error('build/ is missing: run `node build.mjs` first');
if (!fs.existsSync(path.join(OUT, 'index.html'))) throw new Error('site/out/ is missing: run `npm --prefix site run build` first');
fs.cpSync(OUT, BUILD, { recursive: true });

// Every page that search engines may index. Cloudflare Pages serves "a.html" at "/a" and "a/index.html" at "/a/".
const urls = [];
(function walk(dir, rel) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!['scans', 'kjv', '_next', '_not-found', 'a'].includes(e.name)) walk(path.join(dir, e.name), `${rel}${e.name}/`);
      continue;
    }
    if (!e.name.endsWith('.html') || ['404.html', 'proofing.html'].includes(e.name)) continue;
    const html = fs.readFileSync(path.join(dir, e.name), 'utf8');
    if (/<meta name="robots" content="noindex/.test(html)) continue;
    const loc = e.name === 'index.html' ? `/${rel}` : `/${rel}${e.name.slice(0, -5)}`;
    urls.push(loc);
  }
})(BUILD, '');
urls.sort((a, b) => (a === '/' ? -1 : b === '/' ? 1 : a.localeCompare(b, 'en', { numeric: true })));
fs.writeFileSync(path.join(BUILD, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(BUILD, 'robots.txt'), `User-agent: *
Allow: /
Disallow: /a/

Sitemap: ${SITE_URL}/sitemap.xml
`);
console.log(`merged site/out into build/, sitemap.xml lists ${urls.length} pages`);
