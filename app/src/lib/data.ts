import { files } from '../../data/files.ts'
import index from '../../data/index.json'

// The text of the Bible is in the bundle, so the app works with no connection.
// tools/app-data.mjs writes data/ from the transcription and the KJV.

/** A part of a rich text: plain text, or [text, flags] or [text, flags, reference id]. */
export type Seg = string | [string, number] | [string, number, string]
export type Rich = Seg[]

export const FLAG = { i: 1, b: 2, sc: 4, key: 8, measure: 16, unsure: 32, fn: 64 }

/** [key, text, date] */
export type MarginEntry = [string, Rich, string?]
/** [verse, text, margin entries, heading, 1 when the verse comes from the KJV] */
export type VerseRow = [number, Rich, MarginEntry[]?, (string | null)?, 1?]
/** [text, verse (0 when none), kind: 0 note, 1 reflections, 2 heading] */
export type Note = [Rich, number, number]

export interface Chapter {
  /** The printed pages: "Vol. II, p. 990". */
  p?: string
  /** The summary of the chapter. */
  s?: Rich
  /** The title of a psalm. */
  t?: Rich
  v: VerseRow[]
  /** Margin entries that the transcription does not put under a verse: [key, text, verse]. */
  lm?: [string, Rich, number][]
  n?: Note[]
  /** 1 when the chapter has a modern measure. */
  m?: 1
  /** 1 when the chapter is only the KJV text. */
  k?: 1
}

export interface Book {
  code: string
  name: string
  /** ot, nt or apoc (the Apocrypha). */
  t: 'ot' | 'nt' | 'apoc'
  start: number
  count: number
  /** The chapters that have Brown's text. */
  brown: number[]
  /** The chapters that have Brown's notes. */
  noted: number[]
  /** The name of one chapter, when it is not "Chapter": "Psalm". */
  cn?: string
  /** The printed title above the first chapter. */
  eb?: string
  vol?: number
  title?: string
  intro?: Rich[]
}

export const BOOKS = (index as { books: Book[] }).books
export const CONVERSION_NOTE = (index as { conversionNote: string }).conversionNote
const BY_CODE = new Map(BOOKS.map((b) => [b.code, b]))

export const bookByCode = (code: string | undefined) => (code ? BY_CODE.get(code) : undefined)

export const chapterNumbers = (b: Book) => Array.from({ length: b.count }, (_, i) => b.start + i)

export const chapterName = (b: Book, n: number) => `${b.cn ?? b.name} ${n}`

/** The URL slug of the book on the website. */
export const slugOf = (b: Book) =>
  ({ '1Esd': 'esdras-1', '2Esd': 'esdras-2', '1Mac': 'maccabees-1', '2Mac': 'maccabees-2', AddEst: 'esther-rest', S3y: 'song-of-the-three', Sus: 'susanna', Wis: 'wisdom', Sir: 'ecclesiasticus', Tob: 'tobit', Jdt: 'judith', Bar: 'baruch', Bel: 'bel', Man: 'manasses' })[b.code] ??
  b.name.toLowerCase().replace(/ /g, '-')

export function loadChapter(code: string, n: number): Chapter | undefined {
  const file = files[`ch/${code}/${n}`]
  return file ? (file() as Chapter) : undefined
}

/** The KJV text of a book: chapters of verses. Only the 66 books of the canon have it. */
export function loadKjv(code: string): string[][] | undefined {
  const file = files[`kjv/${code}`]
  return file ? (file() as string[][]) : undefined
}

/** A parsed reference id: "Isa.9.6-7,9" → Isaiah 9, verses 6 to 7 and 9. */
export interface Ref {
  book: Book
  chapter: number
  ranges: [number, number][] | null
}

export function parseRef(id: string): Ref | undefined {
  const [code, ch, vv] = id.split('.')
  const book = bookByCode(code)
  if (!book || !+ch) return undefined
  const ranges = vv
    ? vv.split(',').map((p): [number, number] => {
        const [a, b] = p.split('-').map(Number)
        return [a, b || a]
      })
    : null
  return { book, chapter: +ch, ranges }
}

export function refLabel(r: Ref) {
  const verses = r.ranges?.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(', ')
  return `${chapterName(r.book, r.chapter)}${verses ? `:${verses}` : ''}`
}

/** The verses of a reference, as [verse, text]. A whole chapter gives its first verses. */
export function refVerses(r: Ref, max = 12): { verses: [number, string][]; more: boolean } {
  const chapter = loadKjv(r.book.code)?.[r.chapter - 1] ?? []
  let nums: number[] = []
  if (r.ranges) for (const [a, b] of r.ranges) for (let v = a; v <= b; v++) nums.push(v)
  else nums = chapter.map((_, i) => i + 1)
  const shown = nums.slice(0, max).filter((v) => chapter[v - 1])
  return { verses: shown.map((v) => [v, chapter[v - 1]]), more: nums.length > shown.length }
}

/** The plain text of a rich text, without margin keys and footnote marks. */
export function plain(r: Rich, measures = false) {
  return r
    .map((s) => {
      if (typeof s === 'string') return s
      if (s[1] & (FLAG.key | FLAG.fn)) return ''
      if (s[1] & FLAG.measure) return measures ? ` ${s[0]}` : ''
      return s[0]
    })
    .join('')
}

/** What the book has: Brown's notes, the margin references, or the KJV text only. */
export function bookStatus(b: Book) {
  if (b.noted.length === b.count) return 'Notes on each chapter'
  if (b.noted.length) return `Notes on ${b.noted.length} of ${b.count} chapters`
  if (b.brown.length) return 'Margin references'
  return 'King James text only'
}
