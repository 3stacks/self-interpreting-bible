# The Self-Interpreting Bible (web edition)

John Brown of Haddington's *Self-Interpreting Bible*, 4 volumes, built up a section at a time.
The site is modelled on bookofconcord.org: there is a contents page, a reading view for each
section, and a KJV popover on every scripture reference.

## Layout

- `scans/pdfNNN.png`: native 300 dpi page images pulled from the PDF. NNN is the PDF page number.
  They are stored upside down, as in the PDF. The build turns them upright.
- `transcription/pdfNNN.md`: one Markdown file per page, following `transcription/SPEC.md`.
  Sections span pages through `<!-- section: slug -->` and `<!-- continued: slug -->` markers.
- `lib/refs.mjs`: the scripture-reference parser. It reads Roman chapters ("Ps. lxviii. 4, 5; lxix. 1"),
  bare chapters that take their book from the reference before them, and one-chapter books.
  Each reference is checked against the KJV, and anything that does not resolve goes on the proofing list.
- `lib/contents.mjs` groups the aids that stand before Genesis. `lib/volumes.mjs` lists the four printed volumes.
- `lib/genealogy.mjs`: draws the lifespan chart for the Genealogy of the Patriarchs.
- `assets/`: the CSS and JS for the site (popovers, scan viewer, table filters, Bible reader, search, and the year control).
- The year control shows Anno Mundi (A.M.) first. A.M. counts from the Creation. A.M. equals 4004 minus the year before Christ (B.C.). A.D. 1 equals A.M. 4004. To see the printed years, choose B.C.
- The control reads the column headings "Before Christ", "Year of the World", and "Year". A new table must use one of those headings.
- The Bible link opens a transcribed chapter with Brown's notes. When that chapter is on the site, a scripture reference opens that chapter. Any other chapter opens as the King James text.
- `data/kjv-src.json`: KJV text (thiagobodruk/bible, public domain).
- `lib/measures.mjs` adds modern equivalents after biblical measures, for example "two cubits and a half [≈ 1.1 m · 3 ft 9 in]".
  The build adds them. The transcription does not change. Each equivalent is in square brackets and has a label that says it is not in the printed text.
  A sum "of silver" or "of gold" also gets a money value. That value uses the metal prices in `PRICES`. To update the money values, change `PRICES` and its date.
  A reader can turn the equivalents off with "Modern measures" on each chapter page.

## Annotated books (Genesis onward)

- `transcription/genesis/pdfNNN.md`: one file per page, following `transcription/SPEC-genesis.md`.
  It holds the verse text with margin keys (`{a}`, `{1}`), the centre-margin entries keyed to verses,
  and the notes and reflections. Full-page plates have only an `illustration` comment.
- `lib/genesis.mjs` stitches the pages into chapters, joining verses and notes that run across page breaks.
- `tools/kjvcheck.mjs <files>` compares the verse text with the KJV. This edition really does differ in
  places ("show", "first-born", "ear-ring"), so a reported difference means "look at the scan", not "wrong".
- Printed page numbers drift because plates are unnumbered, so each page marker carries the number read
  off the page foot. Plates printed sideways are turned upright in the build (all but those in `UPRIGHT_PLATES`).

## Build and run

    npm install
    npm run build         # writes ./build (and ./artifact-index.html)
    npm run serve         # serves ./build on http://0.0.0.0:8090 and takes corrections

`build/` is a plain static site. `PORT` and `HOST` change where `serve.mjs` listens.

## Corrections

With the site served by `serve.mjs`, every verse, margin entry, note and table row knows the
transcription file and lines it came from (`data-src`). Press **Edit** in the top bar to put a ✎
on each; the **Proofing** page has them on by default. A ✎ opens the source text beside a link to
the page scan. Saving:

1. checks the lines still read what you opened (so two edits can't clobber each other),
2. writes the new text into `transcription/…`,
3. appends the before/after to `corrections/log.jsonl`, and
4. rebuilds the site.

Review with `git diff`, commit, and push to deploy. The Proofing page lists recent corrections.

The proofing tools are for local work only. The tools are the Proofing page, the **Edit** button and the ✎ buttons.
`serve.mjs` builds the site with `SIB_PROOFING=1`, so the tools are there.
A plain `npm run build` leaves them out. The deploy uses a plain build, so the hosted site has no proofing tools.
If `serve.mjs` finds a build without the tools, it builds the site again.

To make ✎ open GitHub's editor in a build with no server, run `SIB_PROOFING=1 npm run build`.
Then set `{"repo": "user/name"}` in `site.config.json`.

## Deploy to Cloudflare Pages

`.github/workflows/cloudflare.yml` builds the site and publishes it on every push to `main`.
The first run creates the Pages project `self-interpreting-bible`.

Do these steps one time:

1. In Cloudflare, get an API token with the permission **Account → Cloudflare Pages → Edit**.
2. In the repository's Settings → Secrets and variables → Actions, add the secret `CLOUDFLARE_API_TOKEN`.
3. In the Actions tab, run **Deploy to Cloudflare Pages**.

The workflow file holds the Cloudflare account ID, because the ID is not secret.

Without the secret, the workflow builds the site and skips the deploy.

## Analytics

The site counts visits with Umami, as hearers.app and lector.dev do. Umami uses no cookies.

- A Pages Function, `functions/a/[[path]].ts`, serves `/a/`. It forwards the tracker and the events
  to Umami, so the Umami address stays secret. The code is in `functions/_lib/analytics.ts`.
- `tools/analytics-loader.mjs` holds the loader. `build.mjs` puts it in the `<head>` of each page.
- The loader loads the tracker after the first input of the visitor.
- `artifact-index.html` has no loader, because the Artifact host has no `/a/` proxy.

To turn on analytics, set these secrets on the Pages project `self-interpreting-bible`:

```bash
npx wrangler pages secret put ANALYTICS_FORWARDING_URL --project-name=self-interpreting-bible
npx wrangler pages secret put ANALYTICS_WEBSITE_ID --project-name=self-interpreting-bible
```

`ANALYTICS_FORWARDING_URL` is the Umami origin with `https://` and no path. `ANALYTICS_WEBSITE_ID`
is the UUID of the Umami website for this site. Then run the deploy workflow again.

When analytics is off, `/a/boot.js` names the secret that is empty or not correct.

Analytics counts only `haddingtonbible.org`, `www.haddingtonbible.org` and
`self-interpreting-bible.pages.dev`. To count another domain, set `ANALYTICS_HOSTS` to a list of
hosts with commas between them. Branch previews and `localhost` send nothing.

## Links to Catechize

Under each verse, the site lists the catechism and confession answers that cite the verse as a proof
text. Each answer links to [Catechize](https://catechize.pages.dev), where a reader can learn it.

- `node tools/fetch-catechize.mjs` gets the list from `/app/data/cited.json` on Catechize. It
  writes the list to `data/catechize-cited.json`. Git ignores that file.
- CI runs the script before each build. If Catechize is not reachable, the build shows no list.
- Catechize links back to each verse that is online here. It reads `backlinks.json`.

## Homepage and search engines

The homepage at `/` is a Next.js site in `site/`. It uses the Primer template of Tailwind Plus, as the Hearers homepage does. The reader contents are at `/contents`.

To build the full site, run these commands:

```bash
node build.mjs
npm --prefix site ci
npm --prefix site run build
node tools/merge-site.mjs
```

- `site/` needs Node 20 or later. CI uses Node 22.
- `tools/merge-site.mjs` copies `site/out/` into `build/`. It then writes `sitemap.xml` and `robots.txt`.
- The sitemap lists each page that has no `noindex` tag. The search page and the Bible page have that tag.
- Each reader page has a description, a canonical URL, Open Graph tags and JSON-LD data.
- Canonical URLs have no `.html`, because Cloudflare Pages serves `genesis-1.html` at `/genesis-1`.
- `SITE_URL` sets the public address. The default is `https://haddingtonbible.org`.
- `assets/og.png` is the image for link previews. `assets/icon.svg` is the site icon.
- The screenshots in `site/src/images/screens/` come from the reader. When the reader design changes, take them again.

## Public address

The public address is `haddingtonbible.org`.

Open `https://haddingtonbible.org`. The Pages project `self-interpreting-bible` serves that name.

`www.haddingtonbible.org` has no DNS record. In that Pages project, add `www.haddingtonbible.org` as a custom domain. Cloudflare then creates the DNS record.

## Adding pages

1. Extract the scans: `pymupdf` `page.get_images()[0]` → `scans/pdfNNN.png`.
2. Transcribe to `transcription/pdfNNN.md` following SPEC.md. Crop full-resolution tiles and rotate them 180° first.
3. Add any new section slugs to `lib/contents.mjs`, then rebuild.

Volume 1 PDF page = printed page + 3.
