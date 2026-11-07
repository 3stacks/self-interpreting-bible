# Homepage

The homepage and the page about John Brown. Next.js builds a static export to
`out/`. The reader pages come from `build.mjs` at the repository root.

```bash
npm install
npm run dev      # the homepage on http://localhost:3000, without the reader
```

To build the full site, run these commands at the repository root:

```bash
node build.mjs
npm --prefix site run build
node tools/merge-site.mjs
```

The last command copies `site/out/` into `build/`. It also writes
`sitemap.xml` and `robots.txt`.

The design comes from the Primer template of Tailwind Plus. `LICENSE.md` holds
the licence of the template.
