import { incomingPath } from '../lib/incoming.ts'

// A link from another app of the suite uses the website form of a chapter.
// Expo Router calls this before it opens a link, so the link opens the chapter.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return incomingPath(path)
}
