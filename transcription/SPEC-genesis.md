# Transcription spec: Genesis with Brown's annotations (Vol. 1, PDF pages 214–302)

Upright full-resolution scans (2550×3300, 300 dpi, 1-bit):
`/tmp/claude-1000/-workspace/7906c19a-55bf-4f47-bd01-4298990c8e1d/scratchpad/gen/up/pdfNNN.png`
(The copies in the project's `scans/` folder are upside down. Do not use those.)
Printed page number = PDF page − 3 (PDF 214 = printed 211).

Output: one file per PDF page, `/workspace/Sites/self-interpreting-bible/transcription/genesis/pdfNNN.md`.

## Goal

A faithful, complete, machine-parseable transcription of everything on the page: the scripture
text with its superscript keys, the centre-margin references and notes, and the commentary at
the foot of the page. Nothing summarised, nothing skipped, nothing added.

## Page anatomy

1. **Running head**: a short caption at each top corner and "GENESIS I." in the middle. Record it as a comment
   (`<!-- running: none -->` on a page without one).
2. **Scripture text**: two wide columns, read left column top to bottom, then right column.
   Verse numbers are full-size at the start of a verse. Superscript letters (a, b, c…) and
   superscript numbers (1, 2, 3…) are *keys* pointing to entries in the centre margin.
   A chapter opens with a heading "CHAPTER V." and an italic summary paragraph with its own
   small verse numbers.
3. **Centre margin**: two narrow columns between the text columns, each topped by a date
   ("B.C. 4004." or "A.M. 2108. B.C. 1896."). They hold the keyed entries: lettered entries
   are cross-references ("a Ps. 33.6; 136.5."), numbered entries are word notes ("1 Heb.
   *between the light*…", "2 i.e. shining warmer.—C."). They may also carry "CHAP. II." labels
   and further dates part-way down.
4. **Notes** (commentary): the small type across the foot in two or three columns. Read
   left column top to bottom, then the next. Paragraphs begin "Ver. 4." / "Ver. 6-8." and a
   new chapter's notes begin "CHAPTER II." Each chapter's notes end with "REFLECTIONS.—".
   Notes run behind the text, so a page's notes may belong to an earlier chapter than its text.

## How to read the scans

Never transcribe from a downscaled whole-page view. Look at a small overview first
(`convert … -resize 25% overview.png`) to find the regions, then crop **full-resolution** tiles,
no wider than ~1000 px and no taller than ~900 px, overlapping ~80 px:

```bash
convert /…/gen/up/pdf214.png -crop 900x850+0+600 +repage $SCRATCH/p214-text-a.png
```

The margin type and the notes type are tiny: crop the margin columns ~400–500 px wide, and the
notes columns one column at a time. Use your own scratch directory for tiles.

## File format

```markdown
<!-- page: 214 printed: 211 -->
<!-- running: The creation. | GENESIS I. | The creation. -->

<!-- intro -->
# The First Book of Moses, Called Genesis
That is, <span class="sc">Generation</span> ...
<span class="sc">Before Christ, 4004.—…</span>

<!-- chapter: 1 -->
<!-- summary -->
1 The creation of heaven and earth, 3 of the light, 6 of the firmament, ...

<!-- text -->
1:1 In the beginning {a}God created the heaven and the earth.
1:2 And the earth was without form, and void; and darkness *was* upon the face of the deep; and the {b}Spirit of God moved upon the face of the waters.
1:3 ¶ And God said, {c}Let there be light: and there was light.
1:7 And God made the firmament, and divided >>

<!-- margin -->
<!-- date: B.C. 4004. -->
1:1 a | Ps. 33.6; 136.5. Jn. 1.1-3. Col. 1.16,17. He. 11.3.
1:2 b | Job 26.13.
1:3 c | 2 Co. 4.6.
1:5 1 | Heb. *between the light and between the darkness.*

<!-- notes -->
## Chapter I.
Ver. 1. That is, in the beginning of time, ...
Ver. 2. ...
```

Next page, continuing:

```markdown
<!-- page: 215 printed: 212 -->
<!-- running: The creation. | GENESIS I. | The creation. -->

<!-- text -->
1:7+ the waters which *were* under the firmament from the waters which *were* above the firmament:{7} and it was so.
...

<!-- margin -->
...

<!-- notes -->
<!-- notes-continued -->
ness and of light were the first day; for ...
```

Rules:

1. **Comments** mark every block: `<!-- intro -->` (book title page only), `<!-- chapter: N -->`
   (Arabic N, where a new chapter's heading appears in the text), `<!-- summary -->` (the italic
   chapter summary), `<!-- text -->`, `<!-- margin -->`, `<!-- notes -->`. If a new chapter starts
   part-way down the text, close the current `<!-- text -->` block and write
   `<!-- chapter: N -->`, `<!-- summary -->`, `<!-- text -->` at that point. Keep reading order.
2. **Scripture text**: one line per verse, `C:V text`, with Arabic chapter:verse.
   - A verse cut off at the bottom of the page ends with ` >>`. A verse continued from the
     previous page starts `C:V+ ` and holds only the part on this page. A verse that breaks
     between the two text columns of the *same* page is joined into one line.
   - Keys: `{a}`, `{b}`, `{1}`, `{2}`, written **exactly where the superscript sits**: lettered
     keys are usually printed *before* their word (`{b}Spirit`), numbered keys usually *after* it
     (`darkness.{1}`, `firmament:{7}`). Two keys together: `{i}blessed{3}` or `{a}{1}word`.
   - Paragraph mark `¶` as printed. KJV italics (supplied words) as `*was*`. `LORD`, `GOD`
     in capitals where printed in small capitals.
   - Keep the printed spelling and punctuation. Join line-break hyphens.
   - Tight typesetting runs words together ("reasonof"): restore the space.
   - At the top of your first page, a verse continued from the previous page has no number:
     identify it from the words (look it up in `data/kjv-src.json`, or look at the foot of the
     previous page's scan) and write it as `C:V+ …`.
   - **Check your text**: run `node /workspace/Sites/self-interpreting-bible/tools/kjvcheck.mjs <your file>`.
     It compares each verse with the KJV. For every difference it reports, look at the scan again:
     fix your misreadings, and keep anything that really is printed that way.
3. **Margin**: one line per entry, `C:V key | text`, where C:V is the verse that contains the
   key in the text. Find it by matching each key to its superscript in the text. Keys restart,
   so match by order and position. If you can't place an entry, use `?:? key | text`.
   - Record dates where they appear: `<!-- date: A.M. 2108. B.C. 1896. -->`.
   - Skip "CHAP. II." labels in the margin; the `<!-- chapter -->` comment covers them.
   - The order is left margin column then right margin column, top to bottom.
4. **Notes**: one paragraph per printed paragraph, separated by a blank line, in reading order.
   - A new chapter's notes start with a heading line: `## Chapter II.` (Title Case, Roman as printed).
     The heading text is removed from the paragraph that follows: "CHAPTER II. Ver. 1. Thus…" becomes
     `## Chapter II.` then `Ver. 1. Thus…`.
   - A word split by a hyphen across the page break stays split: end the page with `dark-`, and
     the next page's continued fragment starts `ness …`.
   - Keep "Ver. 4." / "Ver. 6-8." / "Ver. 19, 20." exactly as printed at the start of a paragraph.
   - Reflections: `REFLECTIONS.—With what…` becomes a paragraph starting `**Reflections.**—With what…`.
   - If the notes on this page open mid-paragraph (continuing the previous page), put
     `<!-- notes-continued -->` on the line before that paragraph. Write the opening fragment
     exactly as printed, even if it starts mid-word.
   - Bracketed passages `[ … ]` and the editors' initials ("—C.", "—P.", "—E.") as printed.
5. **Scripture references** anywhere: transcribe **exactly as printed**, abbreviations and
   all (`Ps. 102.25`, `Jn. 1.1-3`, `2 Pe. 3. 5`, `Ro. 1. 19,20`), with `-` for any range dash.
   Bare chapter.verse continuations stay bare (`Ps. 33. 6, 9; 89. 11, 12`).
6. **Typography**: italics `*…*`, bold `**…**` where the print uses bold. Small capitals (other than LORD/GOD in the text) become
   `<span class="sc">Elohim</span>` (normal case inside). Greek and Hebrew words as printed in
   Unicode when you can read them, otherwise `[Greek]` / `[Hebrew]`. Join line-break hyphens.
   Keep printed spelling ("shew", "connexion").
7. **Uncertain**: `[?]` right after a doubtful word or number. Unreadable: `[illegible]`.
   Zoom in before giving up. Use these sparingly.
8. **Illustrations**: if a page carries an engraving, write `<!-- illustration: caption as printed -->`
   at its place in reading order, and transcribe nothing else from it.
9. Omit the page number at the foot and signature marks such as "Vol. 1—14".

After writing each page, do a verification pass: re-open the margin and notes tiles and check
every scripture reference and every verse number against the scan.
