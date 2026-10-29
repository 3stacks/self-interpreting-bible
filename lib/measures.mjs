// Modern equivalents for biblical measures, added beside the printed words at build time.
// The transcription is never changed: annotateMeasures() inserts a bracketed, labelled
// editorial span after a measure such as "two cubits and a half" or "fifty shekels of silver".
//
// Values are the common scholarly estimates (the long-standing tables in the ESV, NIV and
// NET Bibles agree on these to two figures). They are approximate by nature.

// Metal prices for the money values. Change these (and `asOf`) to refresh the figures.
// Spot prices on 28 October 2026: silver US$53.70 and gold US$4,055 per troy ounce.
const TROY_OZ = 31.1035; // grams
export const PRICES = {
  asOf: '28 October 2026',
  currency: 'US$',
  silver: 53.70 / TROY_OZ, // per gram
  gold: 4055 / TROY_OZ,
};

// kind: length (metres), weight (grams), volume (litres).
// `article`: whether "a"/"an" alone counts as a quantity of one. It is off for words that are
// often figurative or ordinary nouns ("a reed shaken with the wind", "a log").
const UNITS = [
  { re: 'cubits?', kind: 'length', value: 0.457, label: 'cubit', article: true },
  { re: 'spans?', kind: 'length', value: 0.229, label: 'span', article: true },
  { re: 'hand-?\\s?breadths?', kind: 'length', value: 0.076, label: 'handbreadth', article: true },
  { re: 'reeds?', kind: 'length', value: 2.74, label: 'reed (six cubits)', article: false },
  { re: 'furlongs?', kind: 'length', value: 185, label: 'furlong', article: true },
  { re: 'shekels?', kind: 'weight', value: 11.4, label: 'shekel', article: true, money: true },
  { re: 'bekah', kind: 'weight', value: 5.7, label: 'bekah', article: true, money: true },
  { re: 'gerahs?', kind: 'weight', value: 0.57, label: 'gerah', article: true, money: true },
  { re: 'manehs?', kind: 'weight', value: 570, label: 'maneh', article: true, money: true },
  { re: 'talents?', kind: 'weight', value: 34200, label: 'talent', article: true, money: true },
  { re: 'homers?', kind: 'volume', value: 220, label: 'homer', article: true },
  { re: 'ephahs?', kind: 'volume', value: 22, label: 'ephah', article: true },
  { re: 'tenth[- ]deals?', kind: 'volume', value: 2.2, label: 'tenth deal (a tenth of an ephah)', article: true },
  { re: 'omers?', kind: 'volume', value: 2.2, label: 'omer', article: true },
  { re: 'cabs?', kind: 'volume', value: 1.2, label: 'cab', article: true },
  { re: 'baths?', kind: 'volume', value: 22, label: 'bath', article: false },
  { re: 'hin', kind: 'volume', value: 3.7, label: 'hin', article: true },
  { re: 'logs?', kind: 'volume', value: 0.31, label: 'log', article: false },
];

const SMALL = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, threescore: 60, fourscore: 80,
};
const NUM_WORD = `(?:${Object.keys(SMALL).join('|')}|hundred|thousand|score|\\d[\\d,]*(?:\\.\\d+)?)`;
// "two thousand and four hundred", "an hundred and thirty", "threescore and ten", "six hundred thousand".
const NUMBER = `(?:(?:an?\\s+)?${NUM_WORD}(?:(?:\\s+and\\s+|[\\s-]+)${NUM_WORD})*)`;

export function parseNumber(s) {
  let total = 0, current = 0;
  for (const w of s.toLowerCase().replace(/,/g, '').split(/[\s-]+/)) {
    if (w === 'and' || w === 'a' || w === 'an') continue;
    if (/^\d/.test(w)) current += +w;
    else if (w in SMALL) current += SMALL[w];
    else if (w === 'score') current = (current || 1) * 20;
    else if (w === 'hundred') current = (current || 1) * 100;
    else if (w === 'thousand') { total += (current || 1) * 1000; current = 0; }
  }
  return total + current;
}

const FRACTIONS = { half: 1 / 2, third: 1 / 3, fourth: 1 / 4, tenth: 1 / 10 };
const METAL = '(?:\\s+of\\s+(silver|gold|brass))?';

function buildPatterns(u) {
  const unit = `(${u.re})`;
  const art = u.article ? '|an?|a\\s+several' : '';
  return [
    // "half a shekel", "half an hin"
    { re: new RegExp(`\\b(half)\\s+an?\\s+${unit}\\b${METAL}`, 'gi'), qty: () => 0.5 },
    // "the fourth part of an hin", "the tenth part of an ephah"
    { re: new RegExp(`\\b(?:the\\s+)?(third|fourth|tenth)\\s+part\\s+of\\s+an?\\s+${unit}\\b${METAL}`, 'gi'), qty: (m) => FRACTIONS[m[1].toLowerCase()] },
    // "two cubits and a half", "a cubit and a half", "seventy shekels of silver"
    {
      re: new RegExp(`\\b(${NUMBER}${art})\\s+${unit}\\b(\\s+and\\s+a\\s+half)?${METAL}`, 'gi'),
      qty: (m) => {
        const n = /^an?(\s+several)?$/i.test(m[1].trim()) ? 1 : parseNumber(m[1]);
        return n ? n + (m[3] ? 0.5 : 0) : 0;
      },
      metalGroup: 4,
    },
  ];
}

const PATTERNS = UNITS.map((u) => ({ u, list: buildPatterns(u) }));

// ---------- Formatting ----------
const sig = (x, n = 2) => {
  if (x === 0) return 0;
  const p = Math.pow(10, n - Math.ceil(Math.log10(Math.abs(x))));
  return Math.round(x * p) / p;
};
const num = (x) => sig(x).toLocaleString('en-GB', { maximumFractionDigits: 2 });

function length(m) {
  const metric = m < 1 ? `${num(m * 100)} cm` : m < 1000 ? `${num(m)} m` : `${num(m / 1000)} km`;
  const inches = m / 0.0254;
  let imperial;
  if (inches < 12) imperial = `${num(inches)} in`;
  else if (inches < 120) {
    const ft = Math.floor(Math.round(inches) / 12), inch = Math.round(inches) % 12;
    imperial = inch ? `${ft} ft ${inch} in` : `${ft} ft`;
  } else if (m < 1609) imperial = `${num(inches / 12)} ft`;
  else imperial = `${num(m / 1609.344)} miles`;
  return [metric, imperial];
}

function weight(g) {
  const metric = g < 1000 ? `${num(g)} g` : g < 1e6 ? `${num(g / 1000)} kg` : `${num(g / 1e6)} tonnes`;
  const oz = g / 28.3495;
  const imperial = oz < 16 ? `${num(oz)} oz` : oz < 16 * 2240 ? `${num(oz / 16)} lb` : `${num(oz / 16 / 2240)} tons`;
  return [metric, imperial];
}

function volume(l) {
  const metric = l < 1 ? `${num(l * 1000)} ml` : `${num(l)} litres`;
  const pints = l / 0.568261;
  const imperial = pints < 8 ? `${num(pints)} pints` : l < 36.37 ? `${num(l / 4.54609)} gallons` : `${num(l / 36.3687)} bushels`;
  return [metric, imperial];
}

function money(x) {
  const r = sig(x);
  if (r >= 1e6) return `${PRICES.currency}${num(r / 1e6)} million`;
  return `${PRICES.currency}${r.toLocaleString('en-GB', { maximumFractionDigits: r < 10 ? 2 : 0 })}`;
}

function describe(u, qty, metal) {
  const base = qty * u.value;
  const [metric, imperial] = u.kind === 'length' ? length(base) : u.kind === 'weight' ? weight(base) : volume(base);
  let text = `≈ ${metric} · ${imperial}`;
  let title = `One ${u.label} is about ${u.kind === 'length' ? length(u.value)[0] : u.kind === 'weight' ? weight(u.value)[0] : volume(u.value)[0]}.`;
  if (u.money && (metal === 'silver' || metal === 'gold')) {
    text += ` · ${metal} worth ≈ ${money(base * PRICES[metal])}`;
    title += ` The money value is the weight of ${metal} at the spot price on ${PRICES.asOf}. It is not what the sum would buy in the ancient world.`;
  }
  return { text, title };
}

// ---------- Inserting into HTML ----------
// Build the visible text of an HTML fragment, skipping tag markup, the contents of <sup>
// (margin keys like "{b}" sit between words), and link text (scripture references).
function visibleText(html) {
  let text = '';
  const at = []; // at[i] = index in html just after visible char i
  let i = 0, skip = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      const end = html.indexOf('>', i);
      const tag = html.slice(i, end + 1);
      if (/^<(sup|a)\b/i.test(tag)) {
        skip++;
        if (/^<a\b/i.test(tag) && skip === 1) { text += '\u0000'; at.push(end + 1); }
      } else if (/^<\/(sup|a)>/i.test(tag)) skip = Math.max(0, skip - 1);
      i = end + 1;
      continue;
    }
    if (!skip) { text += html[i]; at.push(i + 1); }
    i++;
  }
  return { text, at };
}

export function annotateMeasures(html) {
  if (!/cubit|span|breadth|reed|furlong|shekel|bekah|gerah|maneh|talent|homer|ephah|deal|omer|cab|bath|hin|log/i.test(html)) return html;
  const { text, at } = visibleText(html);
  const hits = [];
  for (const { u, list } of PATTERNS) {
    for (const p of list) {
      for (const m of text.matchAll(p.re)) {
        // "hin" and "log" are case-sensitive words ("Hindostan", "Log").
        const unitWord = m[0].match(new RegExp(u.re, 'i'))?.[0] ?? '';
        if ((u.label === 'hin' || u.label === 'log') && unitWord !== unitWord.toLowerCase()) continue;
        const qty = p.qty(m);
        if (!qty) continue;
        const metal = (m[p.metalGroup ?? m.length - 1] || '').toLowerCase();
        hits.push({ start: m.index, end: m.index + m[0].length, ...describe(u, qty, metal) });
      }
    }
  }
  // Keep the longest match where matches overlap.
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept = [];
  for (const h of hits) if (!kept.length || h.start >= kept.at(-1).end) kept.push(h);
  let out = html;
  for (const h of kept.reverse()) {
    const pos = at[h.end - 1];
    const span = `<span class="conv" title="Added for this edition, not in the printed text. ${h.title}">[${h.text}]</span>`;
    out = out.slice(0, pos) + span + out.slice(pos);
  }
  return out;
}

export const CONVERSION_NOTE = `Measures in square brackets are modern equivalents added for this edition. They are not in the King James text or in Brown’s notes. They use common scholarly estimates: a cubit is about 45.7 cm (18 in), a shekel about 11.4 g (0.4 oz), an ephah about 22 litres. Money values give the worth of the silver or gold at spot prices on ${PRICES.asOf}, not what the sum would buy in the ancient world.`;
