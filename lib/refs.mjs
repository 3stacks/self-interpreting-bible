// Finds scripture references as printed in the book ("Gen. x. 5", "Ps. lxviii. 4, 5; lxix. 1",
// "1 Kings xi. 1-8", "Matt. 24:15") and resolves them to canonical codes, validated against the KJV.
import { BOOKS } from './books.mjs';

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+');

// Build one alternation of every book form, longest first so "Song of Sol" beats "Song".
const forms = [];
for (const [code, , abbrs] of BOOKS) {
  const num = code.match(/^([123])/)?.[1];
  for (const a of abbrs) {
    if (num) {
      const roman = ['I', 'II', 'III'][num - 1];
      forms.push([`${num} ${a}`, code], [`${num}${a}`, code], [`${roman} ${a}`, code], [`${roman}. ${a}`, code]);
    } else {
      forms.push([a, code]);
    }
  }
}
forms.sort((x, y) => y[0].length - x[0].length);
const FORM_CODE = new Map(forms.map(([f, c]) => [f.replace(/\s+/g, ' ').toLowerCase(), c]));

const BOOK_RE = forms.map(([f]) => esc(f)).join('|');
const CH = '(?:[ivxlc]+|\\d{1,3})';
// A comma-separated verse must not be the number of a following book ("Ps. 102.25, 2 Pe. 3. 5").
const VV = '\\d{1,3}(?:\\s*[-–—]\\s*\\d{1,3})?(?:\\s*,\\s*\\d{1,3}(?!\\d|\\s*[A-Z])(?:\\s*[-–—]\\s*\\d{1,3})?)*';
// Book, chapter, optional verses. The chapter/verse separator is ". ", ":" or a space.
const REF_RE = new RegExp(
  `(?<![A-Za-z])(${BOOK_RE})(?:\\.\\s*|\\s+)(${CH})(?![A-Za-z])(?:\\s*[.:]\\s*(${VV})|\\.?)`,
  'g',
);
// Further chapters of the same book after a semicolon or comma: "; ix. 6" or "; 9:6".
const CONT_RE = new RegExp(`^(\\s*[;,]\\s*(?:and\\s+)?)(${CH})\\s*[.:]\\s*(${VV})`);

const BARE_RE = new RegExp(
  `(^|[\\s,;(])(?:([ivxlc]+)\\.\\s*(${VV})(?![\\d.]\\d)|([ivxlc]{2,})\\.(?=[\\s;,)]|$))`,
  'g',
);

const ROMAN = { i: 1, v: 5, x: 10, l: 50, c: 100 };
function roman(s) {
  let n = 0;
  for (let i = 0; i < s.length; i++) {
    const a = ROMAN[s[i]], b = ROMAN[s[i + 1]] || 0;
    n += a < b ? -a : a;
  }
  // Reject malformed numerals ("iiv", "vx") by round-tripping.
  return toRoman(n) === s ? n : null;
}
function toRoman(n) {
  const t = [[100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i']];
  let s = '';
  for (const [v, r] of t) while (n >= v) { s += r; n -= v; }
  return s;
}
function chapterNum(s) {
  return /^\d+$/.test(s) ? +s : roman(s.toLowerCase());
}

function parseVerses(vv) {
  if (!vv) return null;
  return vv.split(',').map((p) => {
    const [a, b] = p.split(/[-–—]/).map((x) => +x.trim());
    return b ? [a, b] : [a, a];
  });
}

export function makeLinker(kjv, onReject = () => {}, annotated = {}) {
  // kjv[code] = array of chapters, each an array of verse strings.
  function valid(code, ch, verses) {
    const book = kjv[code];
    if (!book || !ch || ch > book.length) return false;
    if (!verses) return true;
    const n = book[ch - 1].length;
    return verses.every(([a, b]) => a >= 1 && b >= a && b <= n);
  }
  function refId(code, ch, verses) {
    if (!verses) return `${code}.${ch}`;
    return `${code}.${ch}.` + verses.map(([a, b]) => (a === b ? a : `${a}-${b}`)).join(',');
  }
  function anchor(text, code, ch, verses) {
    const id = refId(code, ch, verses);
    const verse = verses ? verses[0][0] : 0;
    const book = annotated[code];
    const href = book?.chapters?.has(ch)
      ? `${book.slug}-${ch}.html${verse ? `#v${ch}-${verse}` : ''}`
      : `bible.html#${code}.${ch}${verse ? '.' + verse : ''}`;
    return `<a class="ref" href="${href}" data-ref="${id}">${text}</a>`;
  }

  // Bare chapter refs ("xxxv. 28", "Shuah, xxxviii.") borrow the book of the last full ref in the
  // same run of text, as the printed tables do.
  function linkBare(text, code) {
    if (!code) return text;
    return text.replace(BARE_RE, (whole, pre, chS, vv, chOnly) => {
      const ch = chapterNum(chS || chOnly);
      const verses = parseVerses(vv);
      if (!ch || !valid(code, ch, verses)) return whole;
      const shown = whole.slice(pre.length);
      return pre + anchor(shown, code, ch, verses);
    });
  }

  // Links references inside one run of plain text (already HTML-escaped, no tags).
  function linkText(text) {
    let out = '', last = 0, m, lastCode = null;
    REF_RE.lastIndex = 0;
    while ((m = REF_RE.exec(text))) {
      const [whole, bookForm, chS, vv] = m;
      const code = FORM_CODE.get(bookForm.replace(/\s+/g, ' ').toLowerCase());
      let ch = chapterNum(chS);
      let verses = parseVerses(vv);
      // One-chapter books are cited by verse alone ("Jude 8", "3 John 10").
      if (code && !verses && kjv[code]?.length === 1 && ch > 1) { verses = [[ch, ch]]; ch = 1; }
      // A bare "Ps. 1" style chapter ref with no verses needs a dotted abbreviation or full name,
      // so ordinary words followed by a number aren't caught.
      if (!code || !valid(code, ch, verses)) {
        onReject(whole);
        continue;
      }
      // Keep a trailing period outside the link ("Gen. x." at sentence end).
      let linkTextStr = whole;
      out += linkBare(text.slice(last, m.index), lastCode) + anchor(linkTextStr, code, ch, verses);
      lastCode = code;
      last = m.index + whole.length;
      // Chained chapters of the same book.
      let rest = text.slice(last), c;
      while ((c = CONT_RE.exec(rest))) {
        const ch2 = chapterNum(c[2]);
        const v2 = parseVerses(c[3]);
        if (!valid(code, ch2, v2)) break;
        const shown = c[0].slice(c[1].length);
        out += c[1] + anchor(shown, code, ch2, v2);
        last += c[0].length;
        rest = text.slice(last);
      }
      REF_RE.lastIndex = last;
    }
    return out + linkBare(text.slice(last), lastCode);
  }

  // Links references in an HTML string, skipping tags and existing links.
  function linkHtml(html) {
    let depthA = 0;
    return html.split(/(<[^>]+>)/).map((part) => {
      if (part.startsWith('<')) {
        if (/^<a[\s>]/i.test(part)) depthA++;
        else if (/^<\/a>/i.test(part)) depthA--;
        return part;
      }
      return depthA ? part : linkText(part);
    }).join('');
  }

  return { linkText, linkHtml };
}
