import { ANNOTATED } from '../../../lib/annotated.mjs'
import { VOLUMES } from '../../../lib/volumes.mjs'

/** The public address of the site, for canonical URLs and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://haddingtonbible.org').replace(/\/+$/, '')
export const SITE_NAME = 'The Self-Interpreting Bible'
export const REPO_URL = 'https://github.com/3stacks/self-interpreting-bible'
export const KOFI_URL = 'https://ko-fi.com/lukeboyle'
export const HEARERS_URL = 'https://hearers.app'

/**
 * A page of the reader. Cloudflare Pages serves "genesis-1.html" at "/genesis-1",
 * so links have no ".html" and do not go through a redirect.
 */
export const reader = (slug: string) => `/${slug}`

export const CONTENTS_URL = reader('contents')
export const START_URL = reader('genesis-1')
export const SEARCH_URL = reader('search')

type Book = { slug?: string; section?: string; name: string }
type Group = { title: string; books: Book[] }
export interface Volume {
  id: string
  roman: string
  span: string
  books: Book[]
  extras?: Group[]
  extrasFirst?: boolean
}

export const volumes = VOLUMES as Volume[]

const chapterCount = new Map<string, number>(
  (ANNOTATED as { slug: string; chapters: number }[]).map((b) => [b.slug, b.chapters]),
)
export const chaptersOf = (slug: string) => chapterCount.get(slug) ?? 0
export const totalChapters = [...chapterCount.values()].reduce((a, n) => a + n, 0)
export const bookCount = chapterCount.size

/** The link for one entry of a volume's list: a book, or a table or essay. */
export const entryHref = (b: Book) => reader((b.slug ?? b.section)!)
