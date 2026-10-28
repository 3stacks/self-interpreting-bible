# Transcription spec — Blackwood's Aids (Vol 1, PDF pages 32–68)

Source scans: `/workspace/Sites/self-interpreting-bible/scans/pdfNNN.png` (2550×3300, 300 dpi, 1-bit).
`NNN` is the PDF page number (3 digits). The printed page number at the foot is 3 lower (PDF 32 = printed 29).

Output: one Markdown file per PDF page, `/workspace/Sites/self-interpreting-bible/transcription/pdfNNN.md`.

## Goal

A faithful, complete, machine-parseable transcription. Fidelity beats prettiness. Every row,
every note, every footnote, every scripture reference. Nothing summarised, nothing skipped.

## How to read the scans

The pages are dense, with small type. Do NOT transcribe from a downscaled whole-page view.
Crop each page into full-resolution tiles with ImageMagick and read the tiles, e.g.:

```bash
convert scans/pdf032.png -crop 1300x900+0+0 +repage /tmp/your-scratch/pdf032-a.png
```

Use tiles no wider than ~1300 px and no taller than ~1000 px, overlapping by ~80 px so lines
on a boundary aren't lost. For multi-column pages, crop column by column. Use your own scratch
directory for tiles (never write tiles into the project).

After transcribing a page, do a verification pass: re-open the tiles and check every number
(years, ages, chapter/verse) and every scripture reference against the image. Fix errors.

## File format

```markdown
<!-- page: 32 printed: 29 -->

<!-- section: great-periods -->
# Great Periods of Bible History

Optional printed subtitle as a plain paragraph in italics: *Bible history has been divided into ten periods, as follows:*

| Period | Description | Years |
|---|---|---|
| I. | The Antediluvian Period: from the Creation to the Flood | 1657 |

<!-- section: antediluvian-period -->
# The Antediluvian Period

*From the Creation to the Flood (1657 Years).*

...
```

Rules:

1. **Page marker** first line: `<!-- page: NN printed: MM -->`.
2. **Every top-level printed section** (large title) starts with `<!-- section: slug -->` then `# Title`.
   Use the slug given in your brief. If a section **continues** from the previous page (e.g.
   "(Concluded from preceding page)"), use `<!-- continued: slug -->` and NO `#` heading;
   start straight into the content. If you hit a top-level section not in your brief, invent a
   kebab-case slug from its title.
3. Sub-headings inside a section: `##` (e.g. "Shem's Sons and Descendants", "Liquid Measures"),
   `###` for a level below.
4. **Titles in Title Case** (not ALL CAPS), but keep the printed wording exactly.
5. **Tables** → GitHub pipe tables. Header row = the printed column headings (Title Case).
   - When the printer splits one logical table into two side-by-side halves to save space
     (same column headings repeated left and right), merge them into ONE table, left half first.
   - When there are genuinely separate tables, keep them separate under their own `##` heading.
   - Escape a literal `|` as `\|`. Use `<br>` for a deliberate line break inside a cell.
   - Drop leader dots (`........`). An empty printed cell is an empty cell.
   - Ditto marks ("do.", "„", "ditto") — transcribe as printed.
   - If a cell spans several rows in print (e.g. one period name against many events), repeat it
     only in the first row and leave the following cells empty.
6. **Prose** → normal paragraphs. Join hyphenated line-break words ("pro-\nphet" → "prophet").
   Keep real hyphens. Keep original spelling (e.g. "Babylonish", "shew", "connexion").
7. **Italics** `*...*`, **bold** `**...**` where the print clearly uses them. Small caps → normal case.
8. **Scripture references: transcribe EXACTLY as printed**, including lower-case Roman numeral
   chapters and the printer's punctuation, e.g. `Gen. x. 5`, `Ps. lxviii. 4, 5`, `1 Kings xi. 1-8`,
   `Isa. vii. 14; ix. 6`, `Matt. 24:15`. Do not modernise. Keep spaces as printed.
   Use a hyphen `-` for verse ranges whatever dash glyph is printed.
9. **Notes and footnotes**: a "Note.—" paragraph stays a paragraph starting `**Note.**—`.
   Asterisked footnotes: put `*` / `†` markers inline as printed and the footnote text as a
   paragraph at the end of that section beginning with the marker.
10. **Uncertain readings**: append `[?]` immediately after the doubtful word/number.
    Unreadable: `[illegible]`. Use sparingly — zoom in further before giving up.
11. No commentary, no summaries, nothing that isn't on the page — except the markers above.
12. Charts/diagrams that aren't text tables (e.g. a lifespan grid): transcribe the underlying data
    as a table (name, born, age, died, etc. — whatever columns the chart actually encodes), and add
    `<!-- chart: short description of the visual layout -->` above it.
13. Running heads and page numbers at the foot: omit (they are captured by the page marker).
