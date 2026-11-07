import Link from 'next/link'

import { GridPattern } from '@/components/GridPattern'
import { CONTENTS_URL, KOFI_URL, REPO_URL, SEARCH_URL, START_URL } from '@/lib/site'

export function Footer() {
  return (
    <footer className="relative pt-5 pb-20 font-sans sm:pt-14 sm:pb-32">
      <div className="absolute inset-x-0 top-0 h-32 mask-[linear-gradient(white,transparent)] text-slate-900/10">
        <GridPattern x="50%" />
      </div>
      <div className="relative flex flex-col items-center gap-4 text-center text-sm text-slate-600">
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-medium text-slate-900">
          <Link href="/">Home</Link>
          <a href={START_URL}>Genesis 1</a>
          <a href={CONTENTS_URL}>Contents</a>
          <a href={SEARCH_URL}>Search</a>
          <Link href="/john-brown-of-haddington/">John Brown of Haddington</Link>
          <a href={REPO_URL}>GitHub</a>
          <a href={KOFI_URL}>Ko-fi</a>
        </nav>
        <p>Made by Luke Boyle. The printed book is in the public domain.</p>
      </div>
    </footer>
  )
}
