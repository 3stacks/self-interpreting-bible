// Groups for the aids that stand before Genesis.
// Order inside each group follows the printed contents of Volume I.
// A section that is not listed here falls into "Other tables".

const historyEarly = [
  'great-periods', 'antediluvian-period', 'origin-of-nations', 'period-of-the-dispersion',
  'period-of-the-patriarchs', 'period-of-the-wandering', 'genealogy-of-the-patriarchs',
  'period-of-the-theocracy', 'intermediate-period', 'period-of-the-monarchy',
];
const historyLate = [
  'period-of-the-captivity', 'apocryphal-period', 'period-between-the-testaments',
  'first-century', 'comparative-chronology',
];

export const PARTS = [
  {
    title: 'Bible history',
    blurb: 'The periods follow one another from the Creation to the first century.',
    groups: [
      { title: 'From the Creation to the monarchy', slugs: historyEarly },
      { title: 'From the captivity to the first century', slugs: historyLate },
    ],
    slugs: [...historyEarly, ...historyLate],
  },
  {
    title: 'Kings, priests, and the books',
    blurb: 'These tables name the kings, the priests, and the books.',
    slugs: [
      'kings-and-prophets', 'high-priests', 'date-and-origin-of-the-psalms', 'table-of-the-psalms',
      'books-of-the-ot-narrative-order', 'prophetical-books-order', 'books-of-the-ot-authorship',
    ],
  },
  {
    title: 'Prophecy',
    blurb: 'These tables give each prediction and the event that follows it.',
    slugs: [
      'prophecies-pentateuch-historical', 'prophets-chronological', 'prophecies-literally-fulfilled',
      'prophecy-compared-with-history', 'books-of-the-prophets', 'fulfilment-of-prophecy',
    ],
  },
  {
    title: 'Miracles and parables',
    blurb: 'These lists name the miracles and the parables.',
    slugs: ['miracles-of-the-ot', 'parables-of-the-ot', 'parables-of-our-lord'],
  },
  {
    title: 'Words and symbols',
    blurb: 'These lists explain old words in the text, and the symbols in the prophets.',
    slugs: ['obsolete-words', 'glossary-of-symbolic-words'],
  },
  {
    title: 'Lands, plants, and measures',
    blurb: 'These lists name the stones, the plants, the measures, the mountains, and the waters.',
    slugs: ['precious-stones', 'trees-and-plants', 'measures-weights-coins', 'mountains-and-hills', 'rivers-lakes-seas'],
  },
  {
    title: 'Worship and the nations',
    blurb: 'These tables describe worship in Israel. They also name the gods of Greece and Rome.',
    slugs: [
      'feasts-and-festivals', 'jewish-seasons-sacrifices', 'laws-of-the-hebrews',
      'religious-sects-and-factions', 'greek-and-roman-deities',
    ],
  },
  {
    title: 'How to read and how to pray',
    blurb: 'These pages tell you how to read the Bible and how to pray. They also give a plan for one year.',
    slugs: [
      'how-to-read', 'answered-prayers', 'progressive-revelation', 'select-chapters',
      'aids-for-prayer', 'read-bible-in-a-year',
    ],
  },
];
