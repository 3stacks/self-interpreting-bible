import Link from 'next/link'

import { Container } from '@/components/Container'
import { GridPattern } from '@/components/GridPattern'
import { CONTENTS_URL } from '@/lib/site'

export default function NotFound() {
  return (
    <div className="relative flex flex-auto items-center">
      <div className="absolute inset-0 -z-10 mask-[linear-gradient(transparent,white,transparent)] text-slate-900/10">
        <GridPattern x="50%" y="50%" patternTransform="translate(0 60)" />
      </div>
      <Container className="flex flex-col items-center py-16 text-center sm:py-20 lg:py-32">
        <p className="rounded-full px-4 py-1 font-sans text-base font-medium tracking-tight text-slate-900 ring-1 ring-slate-900 ring-inset">
          404
        </p>
        <h1 className="mt-6 font-display text-5xl text-slate-900 sm:text-6xl">Page not found</h1>
        <p className="mt-4 text-lg tracking-tight text-slate-700">This page does not exist.</p>
        <p className="mt-6 flex gap-8 font-sans text-base font-medium">
          <Link href="/" className="text-brand-600 hover:text-brand-800">
            Go to the homepage <span aria-hidden="true">&rarr;</span>
          </Link>
          <a href={CONTENTS_URL} className="text-brand-600 hover:text-brand-800">
            See the contents <span aria-hidden="true">&rarr;</span>
          </a>
        </p>
      </Container>
    </div>
  )
}
