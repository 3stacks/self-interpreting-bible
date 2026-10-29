# Transcription tools

These files drive the transcription of Volumes II to IV by agents.

- `BRIEF-vol2.md`: the brief that each transcription agent reads. Its paths point to the scratch folder of an earlier session.
  Change the scan path (`up2/`) and the `kjvlines.mjs` path before you use it again.
- `VOLMAP.md`: the page map of Volumes II to IV. It gives the start and end of each book, and the plates.
- `kjvlines.mjs <KJV code> <file> <from C:V> <to C:V>`: appends KJV verse lines to a page file.
  Agents start each text block from these lines. Then they edit in the printed differences.
- `versecheck.mjs <folder> <KJV code>`: checks that each verse of a book is present one time,
  and that each verse split across pages joins correctly.

The scans for the agents are the upright copies of `scans/v2/` and the other volume folders.
To make them, rotate each scan 180 degrees (`convert scans/v2/pdf006.png -rotate 180 up2/pdf006.png`).
