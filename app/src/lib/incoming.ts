import { BOOKS, slugOf } from './data.ts'

const CODE_BY_SLUG = new Map(BOOKS.map((b) => [slugOf(b), b.code]))

/**
 * The route for a link from another app of the suite. The other apps link to
 * the website form of a chapter, "haddingtonbible://psalms-23#v23-1". The app
 * route is "/read/Ps/23?v=1". Any other path stays as it is.
 */
export function incomingPath(path: string): string {
  const m = /^(?:haddingtonbible:\/\/|\/)?([a-z0-9-]+?)-(\d+)\/?(?:\?v=(\d+)|#v\d+-(\d+))?$/.exec(path)
  if (!m) return path
  const code = CODE_BY_SLUG.get(m[1])
  if (!code) return path
  const verse = m[3] ?? m[4]
  return `/read/${code}/${m[2]}${verse ? `?v=${verse}` : ''}`
}
