import { About } from '@/components/About'
import { Contents } from '@/components/Contents'
import { Edition } from '@/components/Edition'
import { Features } from '@/components/Features'
import { Footer } from '@/components/Footer'
import { Hero } from '@/components/Hero'
import { Introduction } from '@/components/Introduction'
import { NavBar } from '@/components/NavBar'
import { OnEachPage } from '@/components/OnEachPage'
import { Questions } from '@/components/Questions'
import { JsonLd } from '@/lib/jsonld'
import { SITE_NAME, SITE_URL, volumes } from '@/lib/site'

// The reader pages point at these ids ("/#book", "/#website") in their own structured data.
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: 'Brown’s Self-Interpreting Bible',
      inLanguage: 'en-GB',
      about: { '@id': `${SITE_URL}/#book` },
    },
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/john-brown-of-haddington/#person`,
      name: 'John Brown of Haddington',
      birthDate: '1722',
      deathDate: '1787-06-19',
      nationality: 'Scottish',
      jobTitle: 'Minister and professor of divinity',
      url: `${SITE_URL}/john-brown-of-haddington/`,
      sameAs: ['https://en.wikipedia.org/wiki/John_Brown_of_Haddington'],
    },
    {
      '@type': 'Book',
      '@id': `${SITE_URL}/#book`,
      name: SITE_NAME,
      alternateName: 'New Self-Interpreting Bible Library',
      author: { '@id': `${SITE_URL}/john-brown-of-haddington/#person` },
      dateCreated: '1778',
      genre: 'Bible commentary',
      inLanguage: 'en',
      isAccessibleForFree: true,
      license: 'https://creativecommons.org/publicdomain/mark/1.0/',
      hasPart: volumes.map((v) => ({
        '@type': 'PublicationVolume',
        volumeNumber: v.roman,
        name: `Volume ${v.roman}: ${v.span}`,
        url: `${SITE_URL}/contents#${v.id}`,
      })),
      url: `${SITE_URL}/`,
    },
  ],
}

export default function Home() {
  return (
    <>
      <JsonLd data={structuredData} />
      <Hero />
      <Introduction />
      <NavBar />
      <main>
        <Contents />
        <OnEachPage />
        <Features />
        <Edition />
        <Questions />
        <About />
      </main>
      <Footer />
    </>
  )
}
