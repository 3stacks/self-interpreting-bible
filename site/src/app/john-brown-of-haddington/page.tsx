import { type Metadata } from 'next'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { Footer } from '@/components/Footer'
import { GridPattern } from '@/components/GridPattern'
import { JsonLd } from '@/lib/jsonld'
import { CONTENTS_URL, SITE_NAME, SITE_URL, START_URL } from '@/lib/site'

const title = 'John Brown of Haddington (1722–1787)'
const description =
  'The life of John Brown of Haddington: shepherd boy, self-taught scholar, minister at Haddington and author of the Self-Interpreting Bible.'
const url = `${SITE_URL}/john-brown-of-haddington/`

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/john-brown-of-haddington/' },
  openGraph: { type: 'profile', url: '/john-brown-of-haddington/', title, description, images: ['/og.png'] },
}

const works: [string, string][] = [
  ['1769', 'A Dictionary of the Holy Bible'],
  ['1778', 'The Self-Interpreting Bible'],
  ['1782', 'A Compendious View of Natural and Revealed Religion'],
  ['', 'A Brief Concordance to the Holy Scriptures'],
]

const life: [string, string][] = [
  ['1722', 'Born at Carpow, near Abernethy in Perthshire.'],
  ['c. 1733', 'His father and mother die. He works as a herd boy.'],
  ['', 'He teaches himself Latin, Greek and Hebrew.'],
  ['1751', 'Ordained as minister of the Secession congregation at Haddington, East Lothian.'],
  ['1767', 'The Associate Synod makes him its professor of divinity.'],
  ['1778', 'The Self-Interpreting Bible is published in Edinburgh.'],
  ['1787', 'He dies at Haddington on 19 June.'],
]

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfilePage',
      '@id': url,
      url,
      name: title,
      description,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      mainEntity: { '@id': `${url}#person` },
      breadcrumb: { '@id': `${url}#breadcrumb` },
    },
    {
      '@type': 'Person',
      '@id': `${url}#person`,
      name: 'John Brown of Haddington',
      birthDate: '1722',
      birthPlace: 'Carpow, Perthshire, Scotland',
      deathDate: '1787-06-19',
      deathPlace: 'Haddington, Scotland',
      jobTitle: 'Minister and professor of divinity',
      sameAs: ['https://en.wikipedia.org/wiki/John_Brown_of_Haddington'],
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: 'John Brown of Haddington', item: url },
      ],
    },
  ],
}

export default function JohnBrown() {
  return (
    <>
      <JsonLd data={structuredData} />
      <header className="relative overflow-hidden bg-brand-600 text-white">
        <div className="absolute inset-0 text-white/10">
          <GridPattern x="50%" y="100%" />
        </div>
        <Container className="relative py-16 sm:py-24">
          <nav aria-label="Breadcrumb" className="font-sans text-sm text-brand-100">
            <Link href="/" className="hover:text-white">
              {SITE_NAME}
            </Link>{' '}
            <span aria-hidden="true">/</span> John Brown of Haddington
          </nav>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl">John Brown of Haddington</h1>
          <p className="mt-4 text-2xl text-brand-100">1722–1787. Shepherd boy, scholar, minister, and author of the Self-Interpreting Bible.</p>
        </Container>
      </header>
      <main>
        <Container className="py-16 text-lg tracking-tight text-slate-700 sm:py-20">
          <h2 className="font-display text-4xl text-slate-900">A shepherd who learned the languages of the Bible</h2>
          <p className="mt-4">
            John Brown was born in 1722 at Carpow, a village near Abernethy in
            Perthshire, Scotland. His parents were poor, and both died when he
            was a boy. He then worked as a herd boy, and he had very little
            time at school.
          </p>
          <p className="mt-4">
            While he kept sheep, Brown taught himself Latin, Greek and Hebrew.
            His progress was so fast that some neighbours said that he had his
            learning from the devil. The story says that he walked to St
            Andrews to buy a Greek New Testament, and that a professor gave him
            the book when he read a passage aloud.
          </p>
          <p className="mt-4">
            Later he worked as a pedlar and as a schoolmaster. He studied
            divinity in the Secession Church, which left the Church of
            Scotland in 1733.
          </p>

          <h2 className="mt-14 font-display text-4xl text-slate-900">Minister at Haddington</h2>
          <p className="mt-4">
            In 1751 the Secession congregation at Haddington, East Lothian,
            ordained Brown as its minister. He stayed with that congregation
            for the rest of his life. In 1767 the Associate Synod made him its
            professor of divinity, and he trained its students for the
            ministry at Haddington.
          </p>
          <p className="mt-4">
            Brown wrote much for ordinary readers, who had few other books
            than the Bible.
          </p>

          <h2 className="mt-14 font-display text-4xl text-slate-900">The Self-Interpreting Bible</h2>
          <p className="mt-4">
            Brown published the Self-Interpreting Bible in 1778. It gives the
            King James text with references beside each verse. The references
            send the reader to other passages that explain the verse, so that
            Scripture interprets Scripture. Each chapter ends with notes on its
            hard words and with reflections that apply it.
          </p>
          <p className="mt-4">
            The book went through many editions in Scotland, England and
            America. Later editors added notes, tables and pictures. This site
            gives the text of the four-volume New Self-Interpreting Bible
            Library.
          </p>
          <p className="mt-6 flex flex-wrap gap-x-8 gap-y-2 font-sans text-base font-medium">
            <a href={START_URL} className="text-brand-600 hover:text-brand-800">
              Read Genesis 1 <span aria-hidden="true">&rarr;</span>
            </a>
            <a href={CONTENTS_URL} className="text-brand-600 hover:text-brand-800">
              See the contents <span aria-hidden="true">&rarr;</span>
            </a>
          </p>

          <h2 className="mt-14 font-display text-4xl text-slate-900">His life in dates</h2>
          <ol role="list" className="mt-6 divide-y divide-slate-300/50 rounded-2xl bg-paper-2 px-6 py-3 text-base sm:px-8">
            {life.map(([year, event]) => (
              <li key={event} className="flex gap-6 py-3">
                <span className="w-20 flex-none font-mono text-sm leading-8 text-slate-500">{year}</span>
                <span>{event}</span>
              </li>
            ))}
          </ol>

          <h2 className="mt-14 font-display text-4xl text-slate-900">Main works</h2>
          <ul role="list" className="mt-6 space-y-2">
            {works.map(([year, name]) => (
              <li key={name}>
                <cite className="text-slate-900">{name}</cite>
                {year && <span className="ml-2 font-mono text-sm text-slate-500">{year}</span>}
              </li>
            ))}
          </ul>
        </Container>
      </main>
      <Footer />
    </>
  )
}
