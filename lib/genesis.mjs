// Parses the annotated-Bible page transcriptions (transcription/<book>/pdfNNN.md, see SPEC-genesis.md)
// into chapters: summary, verses with their superscript keys, centre-margin entries, and the notes.
import fs from 'node:fs';
import path from 'node:path';

const ROMAN = { i: 1, v: 5, x: 10, l: 50, c: 100 };
export function roman(s) {
  s = s.toLowerCase();
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const a = ROMAN[s[i]], b = ROMAN[s[i + 1]] || 0;
    if (!a) return NaN;
    n += a < b ? -a : a;
  }
  return n;
}
export const toRoman = (n) => [['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]
  .reduce((s, [r, v]) => { while (n >= v) { s += r; n -= v; } return s; }, '');

export function parseBook(dir) {
  const book = { intro: [], title: '', pages: [], printed: {}, plates: [], chapters: new Map() };
  const chapter = (n) => {
    if (!book.chapters.has(n)) book.chapters.set(n, { n, summary: '', verses: new Map(), margin: [], notes: [], pages: [] });
    return book.chapters.get(n);
  };
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /^pdf\d{3}\.md$/.test(f)).sort() : [];
  let notesChapter = 1;
  let lastNote = null; // the paragraph a `notes-continued` fragment joins
  let lastVerse = null;

  for (const f of files) {
    const pdf = +f.slice(3, 6);
    book.pages.push(pdf);
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    // Photo plates are unnumbered and shift the printed numbering, so take it from the page marker.
    const printed = src.match(/<!--\s*page:\s*\d+\s+printed:\s*(\d+)/)?.[1];
    if (printed) book.printed[pdf] = +printed;
    const plate = src.match(/<!--\s*illustration:\s*([\s\S]*?)-->/);
    if (plate && !/<!--\s*text\s*-->/.test(src)) {
      book.plates.push({ pdf, caption: plate[1].trim(), after: lastVerse && { ...lastVerse } });
      continue;
    }
    // Walk the blocks between structural comments, keeping line numbers so every verse,
    // margin entry and note knows where it came from (for corrections made on the site).
    const rel = `${path.basename(dir)}/${f}`;
    const lineAt = (pos) => src.slice(0, pos).split('\n').length;
    const marks = [...src.matchAll(/<!--\s*(intro|summary|text|margin|notes|chapter:\s*\d+)\s*-->/g)];
    let textChapter = lastVerse?.c ?? 1;
    let pageMarked = false;
    marks.forEach((mk, bi) => {
      const kind = mk[1].trim();
      const from = mk.index + mk[0].length;
      const body = src.slice(from, marks[bi + 1]?.index ?? src.length);
      const first = lineAt(from);
      const lines = body.split('\n').map((text, i) => ({ text: text.trim(), n: first + i }));
      const part = (a, b = a) => ({ file: rel, start: a, end: b });
      if (kind.startsWith('chapter')) {
        textChapter = +kind.split(':')[1];
      } else if (kind === 'intro') {
        for (const para of paragraphs(lines)) {
          const h = para.text.match(/^#\s+(.+)$/);
          if (h) book.title = h[1].trim();
          else book.intro.push({ text: para.text, src: [part(para.start, para.end)] });
        }
      } else if (kind === 'summary') {
        const para = paragraphs(lines)[0];
        if (para) chapter(textChapter).summary = { text: para.text.replace(/^\*(.*)\*$/, '$1'), src: [part(para.start, para.end)] };
      } else if (kind === 'text') {
        for (const { text: line, n } of lines) {
          const m = line.match(/^(\d+):(\d+)(\+)?\s+(.*)$/);
          if (!m) continue;
          const [, c, v, cont] = m;
          const text = m[4].replace(/\s*>>$/, '');
          const ch = chapter(+c);
          if (!ch.pages.includes(pdf)) ch.pages.push(pdf);
          const existing = ch.verses.get(+v);
          if (cont && existing) { existing.text = joinText(existing.text, text); existing.src.push(part(n)); }
          else {
            // The page's scan link goes on the first verse that starts on this page,
            // not on a verse continued from the page before.
            ch.verses.set(+v, { v: +v, text, pdf: pageMarked ? null : pdf, margin: [], src: [part(n)] });
            pageMarked = true;
          }
          lastVerse = { c: +c, v: +v };
        }
      } else if (kind === 'margin') {
        let date = null;
        for (const { text: line, n } of lines) {
          const d = line.match(/^<!--\s*date:\s*(.*?)\s*-->$/);
          if (d) { date = d[1]; continue; }
          const m = line.match(/^(\d+|\?):(\d+|\?)\s+(\S+)\s*\|\s*(.*)$/);
          if (!m) continue;
          const [, c, v, key, text] = m;
          const entry = { key, text, date, src: [part(n)] };
          date = null;
          const ch = chapter(c === '?' ? textChapter : +c);
          const verse = v === '?' ? null : ch.verses.get(+v);
          if (verse) verse.margin.push(entry);
          else ch.margin.push({ ...entry, v: v === '?' ? null : +v });
        }
      } else if (kind === 'notes') {
        let continued = false;
        for (const para of paragraphs(lines, true)) {
          if (para.continued) { continued = true; continue; }
          let text = para.text;
          const h = text.match(/^##\s+Chapter\s+([IVXLC]+)\.?\s*(?:\n?([\s\S]*))?$/i);
          if (h) {
            notesChapter = roman(h[1]);
            chapter(notesChapter);
            continue;
          }
          if (continued && lastNote) {
            lastNote.text = joinText(lastNote.text, text);
            lastNote.src.push(part(para.start, para.end));
          } else {
            lastNote = { text, pdf, src: [part(para.start, para.end)] };
            chapter(notesChapter).notes.push(lastNote);
          }
          continued = false;
        }
      }
    });
  }
  return book;
}

// Group numbered lines into paragraphs (blank-line separated; a "## " heading is its own paragraph).
// Comments are dropped, except that `notes-continued` comes back as a marker when asked for.
function paragraphs(lines, markContinued = false) {
  const out = [];
  let cur = null, inComment = false;
  const flush = () => { if (cur) out.push(cur); cur = null; };
  for (const { text, n } of lines) {
    if (inComment) { if (text.includes('-->')) inComment = false; continue; }
    if (/^<!--/.test(text)) {
      if (markContinued && /notes-continued/.test(text)) { flush(); out.push({ continued: true }); }
      if (!text.includes('-->')) inComment = true;
      continue;
    }
    if (!text) { flush(); continue; }
    if (/^#{1,2}\s/.test(text)) { flush(); out.push({ text, start: n, end: n }); continue; }
    if (cur) { cur.text += ` ${text}`; cur.end = n; } else cur = { text, start: n, end: n };
  }
  flush();
  return out;
}

// Join a fragment carried over a page break: "dark-" + "ness" → "darkness".
function joinText(a, b) {
  return /[a-z]-$/i.test(a) && /^[a-z]/.test(b) ? a.slice(0, -1) + b : `${a} ${b}`;
}
