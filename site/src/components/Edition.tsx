import Image from 'next/image'

import { Container } from '@/components/Container'
import { SectionHeading } from '@/components/SectionHeading'
import titlePage from '@/images/title-page.webp'

export function Edition() {
  return (
    <section id="edition" aria-labelledby="edition-title" className="scroll-mt-14 bg-paper-2 py-16 sm:scroll-mt-32 sm:py-20 lg:py-32">
      <Container size="md" className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="text-lg tracking-tight text-slate-700">
          <SectionHeading number="4" id="edition-title">
            The edition
          </SectionHeading>
          <p className="mt-8 font-display text-4xl tracking-tight text-slate-900">
            The New Self-Interpreting Bible Library, in four volumes.
          </p>
          <p className="mt-4">
            The text comes from a later edition of Brown’s Bible. It
            keeps Brown’s references, notes and reflections. It adds notes by
            Henry Cooke, comments on places by Josiah L. Porter, and an
            introduction by John H. Vincent. James W. Lee edited the
            references and tables.
          </p>
          <p className="mt-4">
            The edition also has photographs of Bible lands by Robert E. M.
            Bain, and Blackwood’s Comprehensive Aids to the Study of the Bible
            at the start of Volume I.
          </p>
          <p className="mt-4">
            The book is in the public domain. The transcription is free for
            anyone to read and to quote.
          </p>
        </div>
        <figure>
          <Image
            src={titlePage}
            alt="The title page of the New Self-Interpreting Bible Library, Volume IV"
            className="w-full -rotate-1 rounded-sm bg-white p-3 shadow-xl ring-1 ring-slate-900/10"
            sizes="(min-width: 1024px) 28rem, 100vw"
          />
          <figcaption className="mt-4 text-center font-sans text-sm text-slate-500">The title page of Volume IV</figcaption>
        </figure>
      </Container>
    </section>
  )
}
