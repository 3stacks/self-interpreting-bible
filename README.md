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

On the hosted site there is no server, so ✎ opens the source file in GitHub's editor instead
(the repository comes from the Actions run; locally, set `{"repo": "user/name"}` in `site.config.json`).

## Deploy to Cloudflare Pages

`.github/workflows/cloudflare.yml` builds the site and publishes it on every push to `main`.
The first run creates the Pages project `self-interpreting-bible`.

Do these steps one time:

1. In Cloudflare, create an API token with the permission **Account → Cloudflare Pages → Edit**.
2. In the repository's Settings → Secrets and variables → Actions, add the secret `CLOUDFLARE_API_TOKEN`.
3. Add the secret `CLOUDFLARE_ACCOUNT_ID`. Copy the account ID from the Cloudflare dashboard.
4. In the Actions tab, run **Deploy to Cloudflare Pages**.

Without the secrets, the workflow builds the site and skips the deploy.

## Adding pages

1. Extract the scans: `pymupdf` `page.get_images()[0]` → `scans/pdfNNN.png`.
2. Transcribe to `transcription/pdfNNN.md` following SPEC.md. Crop full-resolution tiles and rotate them 180° first.
3. Add any new section slugs to `lib/contents.mjs`, then rebuild.

Volume 1 PDF page = printed page + 3.
