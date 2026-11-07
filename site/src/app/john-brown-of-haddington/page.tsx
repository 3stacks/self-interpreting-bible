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

const DNB_URL = 'https://en.wikisource.org/wiki/Dictionary_of_National_Biography,_1885-1900/Brown,_John_(1722-1787)'

const works: [string, string][] = [
  ['1758', 'An Help for the Ignorant: an explanation of the Westminster Confession and Catechism'],
  ['1769', 'A Dictionary of the Bible'],
  ['1771', 'A General History of the Christian Church'],
  ['1778', 'The Self-Interpreting Bible'],
  ['1782', 'A Compendious View of Natural and Revealed Religion'],
  ['1783', 'A Brief Concordance to the Holy Scriptures'],
]

const life: [string, string][] = [
  ['1722', 'Born at Carpow, in the parish of Abernethy, Perthshire.'],
  ['c. 1733', 'His father dies when he is eleven. His mother dies soon after. He becomes a herd boy.'],
  ['1745', 'Serves with the government soldiers in the rising, for a time in the garrison of Edinburgh Castle.'],
  ['', 'Works as a pedlar, then as a schoolmaster at Gairney Bridge and at Penicuik.'],
  ['1750', 'Licensed to preach by the Associate (Burgher) Synod.'],
  ['1751', 'Called to the Associate congregation at Haddington, East Lothian.'],
  ['1768', 'Appointed professor of divinity to the Associate Burgher Synod.'],
  ['1778', 'The Self-Interpreting Bible is published at Edinburgh, in two volumes.'],
  ['1787', 'Dies at Haddington on 19 June, and is buried in the churchyard there.'],
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
            John Brown was born in 1722 at Carpow, in the parish of Abernethy,
            Perthshire. His father was a poor weaver, who could pay for only a
            few terms of school. His father died when John was eleven, and his
            mother died soon after. He then worked as a herd boy.
          </p>
          <p className="mt-4">
            While he kept sheep, he taught himself Latin, Greek and Hebrew. For
            a time he had no Greek grammar, and he worked out the letters by
            himself. A well-known story tells how he got his first Greek New
            Testament. He left the sheep with a friend, walked through the night
            to St Andrews, twenty-four miles away, and asked for the book. A
            professor heard him. “Boy,” he said, pointing to a passage, “read
            this, and you shall have the book for nothing.” Brown read it, and
            walked home with the book.
          </p>
          <p className="mt-4">
            Some people could not believe that a herd boy had learned so much,
            and they said that he had his learning from Satan. It took him some
            years to live that story down.
          </p>
          <p className="mt-4">
            He then worked as a pedlar. In the rising of 1745 he served with the
            government soldiers, for a time in the garrison of Edinburgh Castle.
            After the war he became a schoolmaster, first at Gairney Bridge near
            Kinross, then at Penicuik near Edinburgh.
          </p>

          <h2 className="mt-14 font-display text-4xl text-slate-900">Minister at Haddington</h2>
          <p className="mt-4">
            Brown belonged to the Secession Church. When it divided in 1747, he
            joined the Burgher side, and he studied for the ministry under
            Ebenezer Erskine and James Fisher. He was licensed to preach in
            1750. In 1751 the small and poor Associate congregation at
            Haddington called him as its minister. A church in New York later
            invited him, but he stayed at Haddington for the rest of his life.
          </p>
          <p className="mt-4">
            In 1768 the Associate Burgher Synod made him its professor of
            divinity. The office had no salary. Each year the students came to
            Haddington for a session of nine weeks.
          </p>

          <h2 className="mt-14 font-display text-4xl text-slate-900">The Self-Interpreting Bible</h2>
          <p className="mt-4">
            The Self-Interpreting Bible was published at Edinburgh in 1778, in
            two volumes. In the preface, Brown gave its purpose: to present the
            work of the best commentators “in a manner that might best comport
            with the ability and leisure of the poorer and labouring part of
            mankind, and especially to render the oracles of God their own
            interpreter.”
          </p>
          <p className="mt-4">
            The book was soon popular, and it stayed in print for more than a
            century. These lines of Robert Burns show how well Scotland knew
            Brown’s books:
          </p>
          <blockquote className="mt-4 border-l-4 border-brand-200 pl-6 font-display text-xl text-slate-800 italic">
            <p>
              For now I’m grown sae cursed douce,
              <br />I pray an’ ponder butt the house;
              <br />My shins, my lane, I there sit roastin’
              <br />Perusing Bunyan, Brown, an’ Boston.
            </p>
            <footer className="mt-2 font-sans text-sm text-slate-500 not-italic">Robert Burns, “Epistle to James Tennant of Glenconner”</footer>
          </blockquote>
          <p className="mt-4">
            Later editors added to the book. Henry Cooke published an edition at
            Glasgow in 1855. This site gives the text of a later four-volume
            edition, the New Self-Interpreting Bible Library.
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

          <h2 className="mt-14 font-display text-4xl text-slate-900">Sources</h2>
          <ul role="list" className="mt-6 space-y-3 text-base">
            <li>
              Francis Watt, “Brown, John (1722–1787)”, in the{' '}
              <a href={DNB_URL} className="font-medium text-brand-600 hover:text-brand-800">
                Dictionary of National Biography
              </a>
              , volume 7 (1886). The facts and quotations on this page come from this article.
            </li>
            <li>
              William Brown, a memoir of his father, in John Brown’s <cite>Select Remains</cite> (Edinburgh, 1856). The
              Dictionary calls it the most authentic life.
            </li>
          </ul>
        </Container>
      </main>
      <Footer />
    </>
  )
}
