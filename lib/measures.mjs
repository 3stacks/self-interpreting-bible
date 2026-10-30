// Modern equivalents for biblical measures, added beside the printed words at build time.
// The transcription is never changed: annotateMeasures() inserts a bracketed, labelled
// editorial span after a measure such as "two cubits and a half" or "fifty shekels of silver".
//
// Values are the common scholarly estimates (the long-standing tables in the ESV, NIV and
// NET Bibles agree on these to two figures). They are approximate by nature.

// Metal prices for the money values. Change these (and `asOf`) to refresh the figures.
// Spot prices on 28 October 2026: silver US$53.70 and gold US$4,055 per troy ounce.
// Copper (COMEX, 23 October 2026): about US$6.49 per pound.
const TROY_OZ = 31.1035; // grams
export const PRICES = {
  asOf: '28 October 2026',
  currency: 'US$',
  silver: 53.70 / TROY_OZ, // per gram
  gold: 4055 / TROY_OZ,
  copper: 6.49 / 453.592,
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
  return `${PRICES.currency}${r.toLocaleString('en-GB', r < 10 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 })}`;
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
  return insertConv(html, at, kept);
}

function insertConv(html, at, hits) {
  let out = html;
  for (const h of [...hits].reverse()) {
    const pos = at[h.end - 1];
    const span = `<span class="conv" title="Added for this edition, not in the printed text. ${h.title}">[${h.text}]</span>`;
    out = out.slice(0, pos) + span + out.slice(pos);
  }
  return out;
}

// ---------- The aids page "Scripture Measures, Weights and Coins" ----------
// Blackwood gives his own modern figures for the cubit (19 inches for the Mosaic cubit), so this
// page does not get the general cubit estimates that the Bible chapters get.
// Blackwood gives his figures in 1880s American units: inches, feet, US gallons, grains and
// dollars. This page gets metric equivalents for those figures, and two added columns in each
// table. The dollar values in the money table are the worth of the metal at 1880s prices, so the
// added column gives the worth of the same weight of metal today.

const GRAIN = 0.06479891; // grams
const US_GALLON = 3.785411784; // litres

// "15.8763", "12,500", "2½", "37½", "8 4-5", "2 73-144", "58 6-7". With `pointThousands`, a
// three-figure group after a point is a thousands group printed with a point ("13.200" grains).
const VULGAR = { '½': 1 / 2, '¼': 1 / 4, '¾': 3 / 4, '⅛': 1 / 8 };
const PRINTED_NUM = '\\d[\\d,]*(?:\\.\\d+)?(?:[½¼¾⅛]|\\s\\d+-\\d+)?';
export function parsePrinted(s, pointThousands = false) {
  s = s.trim();
  const frac = s.match(/^(\d+)\s(\d+)-(\d+)$/);
  if (frac) return +frac[1] + frac[2] / frac[3];
  const v = s.match(/^([\d,.]+)([½¼¾⅛])$/);
  if (v) return parsePrinted(v[1]) + VULGAR[v[2]];
  if (pointThousands && /^\d{1,3}\.\d{3}$/.test(s)) return +s.replace('.', '');
  return +s.replace(/,/g, '');
}

const metric = (x, unit) => `${num(x)} ${unit}`;
const PRINTED_UNITS = [
  // "15 ft. 10 in.", "606 feet 9 inches", "1 foot 8½ inches"
  { re: `(${PRINTED_NUM})\\s+(?:feet|foot|ft\\.)\\s+(${PRINTED_NUM})\\s+(?:inches|in\\.)`, conv: (m) => length((parsePrinted(m[1]) * 12 + parsePrinted(m[2])) * 0.0254)[0] },
  { re: `(${PRINTED_NUM})\\s+(?:English\\s+)?(?:square\\s+feet|sq\\.\\s+feet)`, conv: (m) => metric(parsePrinted(m[1]) * 0.09290304, 'm²') },
  { re: `(${PRINTED_NUM})\\s+(?:square\\s+inches|sq\\.\\s+inches)`, conv: (m) => metric(parsePrinted(m[1]) * 6.4516, 'cm²') },
  { re: `(${PRINTED_NUM})\\s+(?:inches|in\\.)`, conv: (m) => length(parsePrinted(m[1]) * 0.0254)[0] },
  { re: `(${PRINTED_NUM})\\s+(?:feet|foot|ft\\.)`, conv: (m) => length(parsePrinted(m[1]) * 0.3048)[0] },
  { re: `(${PRINTED_NUM})\\s+grains`, conv: (m) => weight(parsePrinted(m[1]) * GRAIN)[0] },
].map((u) => ({ ...u, re: new RegExp(u.re, 'g') }));

function annotatePrinted(html) {
  const { text, at } = visibleText(html);
  const hits = [];
  for (const u of PRINTED_UNITS) {
    for (const m of text.matchAll(u.re)) {
      hits.push({ start: m.index, end: m.index + m[0].length, text: `≈ ${u.conv(m)}`, title: 'A metric equivalent of the printed figure.' });
    }
  }
  hits.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept = [];
  for (const h of hits) if (!kept.length || h.start >= kept.at(-1).end) kept.push(h);
  return insertConv(html, at, kept);
}

const cellText = (c) => c.replace(/<[^>]+>/g, '').trim();
const addedTh = (label, title) => `<th class="conv-col" title="Added for this edition, not in the printed text. ${title}">${label}</th>`;
const addedTd = (value) => `<td class="conv-col">${value}</td>`;

function convertTable(table) {
  const heads = [...table.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => cellText(m[1]));
  const gallons = heads.map((h, i) => (/Gallons/i.test(h) ? i : -1)).filter((i) => i >= 0);
  const grains = heads.findIndex((h) => /Grains/i.test(h));
  let added = [], cells;
  if (gallons.length) {
    added = gallons.map((i) => addedTh(`${heads[i].replace(/\.?\s*Gallons\.?/i, '')}, litres`, 'The printed US gallons in litres.'));
    cells = (tds) => gallons.map((i) => addedTd(num(parsePrinted(cellText(tds[i])) * US_GALLON))).join('');
  } else if (grains >= 0) {
    added = [
      addedTh('Weight today', 'The printed grains in grams.'),
      addedTh('Metal value today', `The same weight of gold, silver or copper at the spot price on ${PRICES.asOf}. It is not what the sum would buy in the ancient world.`),
    ];
    cells = (tds) => {
      const g = parsePrinted(cellText(tds[grains]), true) * GRAIN;
      const metal = cellText(tds[0]).match(/gold|silver|copper/i)?.[0].toLowerCase();
      const value = metal ? g * PRICES[metal] : null;
      return addedTd(weight(g)[0]) + addedTd(value == null ? '' : value < 0.01 ? `under ${PRICES.currency}0.01` : money(value));
    };
  } else return table;
  return table
    .replace(/(<thead>[\s\S]*?)(<\/tr>)/, (m, a, b) => a + added.join('') + b)
    .replace(/<tbody>[\s\S]*?<\/tbody>/, (body) => body.replace(/(<tr[^>]*>)([\s\S]*?)(<\/tr>)/g, (m, open, inner, close) => {
      const tds = [...inner.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((x) => x[1]);
      return open + inner + cells(tds) + close;
    }));
}

export function annotateMeasuresPage(html) {
  html = html.replace(/<table>[\s\S]*?<\/table>/g, convertTable);
  return html.replace(/<(p|h3)\b([^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => `<${tag}${attrs}>${annotatePrinted(inner)}</${tag}>`);
}

export const PAGE_CONVERSION_NOTE = `Figures in square brackets, and the shaded columns, are modern equivalents added for this edition. They are not in the printed text. Lengths and areas are metric equivalents of Blackwood’s inches and feet, and the capacity columns convert his US gallons to litres. The money columns give the weight of each coin in grams. They also give the worth of that weight of gold, silver or copper at spot prices on ${PRICES.asOf}. This worth is not the buying power of the sum in the ancient world.`;

export const CONVERSION_NOTE = `Measures in square brackets are modern equivalents added for this edition. They are not in the King James text or in Brown’s notes. They use common scholarly estimates: a cubit is about 45.7 cm (18 in), a shekel about 11.4 g (0.4 oz), an ephah about 22 litres. Money values give the worth of the silver or gold at spot prices on ${PRICES.asOf}, not what the sum would buy in the ancient world.`;
