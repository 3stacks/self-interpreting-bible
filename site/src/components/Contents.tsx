import { Container } from '@/components/Container'
import { SectionHeading } from '@/components/SectionHeading'
import { chaptersOf, CONTENTS_URL, entryHref, volumes, type Volume } from '@/lib/site'

function BookList({ books }: { books: Volume['books'] }) {
  return (
    <ul role="list" className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
      {books.map((b) => (
        <li key={b.slug ?? b.section} className="flex items-baseline justify-between gap-3 border-b border-slate-300/40 py-2">
          <a href={entryHref(b)} className="font-medium text-slate-900 underline decoration-brand-200 underline-offset-4 hover:text-brand-600">
            {b.name}
          </a>
          {b.slug && chaptersOf(b.slug) > 0 && (
            <span className="flex-none font-mono text-xs text-slate-400">{chaptersOf(b.slug)} ch.</span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function Contents() {
  return (
    <section id="contents" aria-labelledby="contents-title" className="scroll-mt-14 py-16 sm:scroll-mt-32 sm:py-20 lg:py-32">
      <Container>
        <SectionHeading number="1" id="contents-title">
          Contents
        </SectionHeading>
        <p className="mt-8 font-display text-4xl tracking-tight text-slate-900">
          Four volumes, from Genesis to Revelation.
        </p>
        <p className="mt-4 text-lg tracking-tight text-slate-700">
          The site follows the order of the printed books. Each book opens with
          its introduction. Each chapter has its own page, and each verse has
          its own link.
        </p>
      </Container>
      <Container size="lg" className="mt-16">
        <ol role="list" className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {volumes.map((vol) => (
            <li key={vol.id} className="rounded-2xl bg-paper-2 px-6 py-6 sm:px-8 sm:py-8">
              <h3 className="font-display text-3xl tracking-tight text-slate-900">
                <a href={`${CONTENTS_URL}#${vol.id}`} className="hover:text-brand-600">
                  <span className="block font-sans text-sm font-medium tracking-[0.14em] text-rubric uppercase">
                    Volume {vol.roman}
                  </span>
                  {vol.span}
                </a>
              </h3>
              <div className="mt-4 text-base">
                {vol.extrasFirst &&
                  vol.extras?.map((g) => (
                    <div key={g.title} className="mb-6">
                      <h4 className="font-sans text-sm font-medium tracking-wide text-slate-500 uppercase">{g.title}</h4>
                      <BookList books={g.books} />
                    </div>
                  ))}
                {vol.roman === 'I' && (
                  <p className="mb-4 text-slate-600">
                    The volume opens with Blackwood’s aids: histories, tables
                    of kings and prophecies, measures and money, and guides to
                    Bible study.{' '}
                    <a href={`${CONTENTS_URL}#before-genesis`} className="font-sans font-medium text-brand-600 hover:text-brand-800">
                      See the aids <span aria-hidden="true">&rarr;</span>
                    </a>
                  </p>
                )}
                <BookList books={vol.books} />
                {!vol.extrasFirst &&
                  vol.extras?.map((g) => (
                    <div key={g.title} className="mt-6">
                      <h4 className="font-sans text-sm font-medium tracking-wide text-slate-500 uppercase">{g.title}</h4>
                      <BookList books={g.books} />
                    </div>
                  ))}
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
