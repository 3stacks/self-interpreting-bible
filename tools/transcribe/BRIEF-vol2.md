# Brief: transcribing Volume II (Self-Interpreting Bible)

You transcribe scanned pages of John Brown's *Self-Interpreting Bible* (an 1880s public-domain Bible
with commentary) into Markdown. Your prompt names the book, its folder, its KJV code, and your pages.

## Read first
- The spec: `/workspace/inbox/self-interpreting-bible/code/transcription/SPEC-genesis.md`. Apply it to your book.
- Models (Volume I, same layout): `transcription/joshua/pdf549.md` and `transcription/deuteronomy/pdf543.md` (text pages),
  `transcription/deuteronomy/pdf545.md` (full-page plate), `transcription/joshua/pdf547.md` (a book that starts
  part-way down a page, with `<!-- intro -->`), `transcription/deuteronomy/pdf547.md` (a book that ends part-way down a page).

## Overrides to the spec
- Project root: `/workspace/inbox/self-interpreting-bible/code`.
- **Volume II scans**, upright, full resolution: `/tmp/claude-1000/-workspace/11c3aba7-d2df-4701-8fe5-4738fe21800f/scratchpad/sib/up2/pdfNNN.png`
  (NNN = Volume II PDF page, zero-padded to 3 digits). Neighbouring pages are there too.
  Exception: **page 549 is scanned upside down** even in `up2/`; rotate it 180° before reading.
- Output: `transcription/<folder>/pdfNNN.md`, with the Volume II PDF page number (e.g. `transcription/judges/pdf006.md`, three digits).
  The first line is `<!-- page: NNN printed: … -->` with the same NNN (no leading zeros needed there: `<!-- page: 6 printed: 4 -->`).
- Printed page number: read it from the foot of each scan. Never compute it. Plates are irregular.
- A full-page plate (engraving or map): `printed: none`, `<!-- running: none -->`, and one `<!-- illustration: … -->` comment
  with the caption as printed (captions are often sideways: crop the strip and rotate it). For a map, give the map title.
- **Shared pages.** When a book ends part-way down a page and the next book starts below it, each book gets its own file for
  that page, in its own folder, holding only that book's part. The ending book's file ends with `<!-- end of book -->`; the
  starting book's file has `<!-- intro -->` with `# ` and the book title as printed, then its introduction, then chapter 1.
  Your prompt says which part of a shared page is yours.
- **Concluding remarks.** Many books end with a section "CONCLUDING REMARKS ON THE BOOK OF …". Put it in the notes block, after
  the last chapter's notes: a heading line `## Concluding Remarks on the Book of Judges.` (Title Case, as printed), then its
  paragraphs. Then `<!-- end of book -->` at the end of the book.
- **Psalms.** Each psalm is a chapter: `<!-- chapter: 23 -->`, then `<!-- summary -->` with Brown's italic summary if printed,
  then `<!-- text -->`. A psalm's printed title above verse 1 ("A Psalm of David.", "To the chief Musician …") goes on its own line
  `title: A Psalm of David.` directly after that `<!-- text -->` and before verse 1. The KJV prefill does not include titles: type
  them from the scan (keys and italics as printed). "Selah" stays in its verse as printed. Notes headings are `## Psalm XXIII.`
  (a printed "PSALM XXIII." heading); if the print says "CHAPTER", still write `## Psalm …`.
  A margin entry keyed in a psalm title is filed under verse 1 (`34:1 a`); the build links title keys to it.
- **Footnotes in the notes.** A small footnote at the foot of the notes, keyed by a superscript in a notes paragraph: write the key
  as `{1}` where it sits in that paragraph, and the footnote as its own paragraph starting `{1} ` right after it.
- Conventions (follow the Volume I files): keys `{a}` / `{1}`; a margin entry continued from the previous page is `?:? | …`
  at the top of the margin block; margin references compact (`Nu.21.21-35`), references in the notes spaced as printed;
  straight apostrophes (`'`); a chapter whose notes are only reflections gets `## Chapter X.` then `**Reflections.**—…`.
- Check verse text with `node tools/kjvcheck.mjs <file>` (run from the project root). For each difference, look at the scan:
  fix misreadings, keep true printed variants.

## Required way of working
Transcription agents have been cut off by a false content-filter block, losing unsaved work. So:
1. **Do not type the scripture text yourself.** Find the first and last verse on the page from the scan, write the header
   comments and `<!-- text -->` to the file, then generate the verse lines from the KJV:
   `node /tmp/claude-1000/-workspace/11c3aba7-d2df-4701-8fe5-4738fe21800f/scratchpad/sib/kjvlines.mjs <KJV code> <output file> <first C:V> <last C:V>`
   Then compare with the scan and make **small, targeted edits** with short Edit old/new strings: keys, `*italics*`, `¶`,
   `C:V+` / ` >>` for verses split across pages, the chapter/summary comments (insert `<!-- chapter: N -->`, `<!-- summary -->`
   and the summary text, and a new `<!-- text -->` before the chapter's first verse), and any word the print gives differently.
   The KJV source uses curly apostrophes and sometimes a space before a comma; fix both.
2. **Do not type the notes yourself either.** For each notes column, find its box on the scan (full-resolution pixel
   coordinates, tight to the column, excluding the column rules), then append the OCR text to the file:
   `python3 -I /tmp/claude-1000/-workspace/11c3aba7-d2df-4701-8fe5-4738fe21800f/scratchpad/sib/ocrappend.py <scan> <x> <y> <w> <h> <output file>`
   It appends the column as one running line (line-end hyphens joined). **Compare the OCR with the scan for missing
   lines**: if lines are missing, delete that OCR text and run again on smaller strips (the helper deskews and uses Tesseract psm 6). Then compare with full-resolution tiles and fix it
   with **small, targeted edits** only: OCR misreadings, paragraph breaks (replace the space before "Ver. 5." with a blank
   line), `## Chapter X.` headings, `**Reflections.**—`, italics, small capitals, a real hyphen that the join removed, and a
   word split across columns. Never retype a paragraph, and never put more than a short phrase in one edit's new text.
   Long margin notes (several lines of prose) can use the same helper on a margin-column box.
3. **Save after each step**: the margin one column at a time, then the notes one column at a time.
4. **Keep every message short and neutral** ("text block done", "margin column 1 done"). Never quote or paraphrase the
   page's content in your messages or in your final report.

## Method
Never transcribe from a downscaled view. Look at a small overview to find the regions, then crop full-resolution tiles
(no wider than ~1000 px, no taller than ~900 px). Margin columns: crop about 200 px wide and upscale 200%. Notes: one column
at a time. Scans can be skewed; re-crop columns lower down if they drift. Put tiles in your own folder under
`/tmp/claude-1000/-workspace/11c3aba7-d2df-4701-8fe5-4738fe21800f/scratchpad/sib/t2/`. **Do not delete anything** (no `rm`):
the tile folders are cleared centrally. At a batch edge, look at the foot of the previous page or the head of the next to find a verse
or note that runs across.

## Limits
Only create or edit your own page files. Other agents write the neighbouring pages at the same time. Do not run the site
build, git, or npm.

## Report back: one line per page, nothing else
`pdfNNN: printed N, C:V–C:V (or plate), kjvcheck D kept, [?] Q` — then at most two short lines for anything the spec did not cover.
