import Image, { type StaticImageData } from 'next/image'

import { Container } from '@/components/Container'
import { SectionHeading } from '@/components/SectionHeading'
import { HEARERS_URL } from '@/lib/site'
import searchImage from '@/images/screens/search.webp'
import tableImage from '@/images/screens/table.webp'
import heroImage from '@/images/screens/hero.webp'

const features: { title: string; description: React.ReactNode; image: StaticImageData; alt: string; top?: boolean }[] = [
  {
    title: 'Search everything',
    description: 'Find a word, a name or a reference in the text, the notes and the tables of all four volumes.',
    image: searchImage,
    alt: 'Search results for Nicodemus, with each match in context',
    top: true,
  },
  {
    title: 'The tables and aids',
    description:
      'A harmony of the Gospels, the parables and miracles of Christ, the kings and prophets, and the measures and money of the Bible.',
    image: tableImage,
    alt: 'The harmony of the four Gospels, as a table with a column for each Gospel',
    top: true,
  },
  {
    title: 'Read on any device',
    description: (
      <>
        The pages work on a phone, a tablet or a computer. Under each verse,
        see the catechism answers that cite it, and learn them in{' '}
        <a href={HEARERS_URL} className="font-medium text-brand-600 hover:text-brand-800">
          Hearers
        </a>
        .
      </>
    ),
    image: heroImage,
    alt: 'John 3 on a phone',
  },
]

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-14 overflow-x-clip py-16 sm:scroll-mt-32 sm:py-20 lg:py-32">
      <Container>
        <SectionHeading number="3" id="features-title">
          Features
        </SectionHeading>
        <p className="mt-8 font-display text-4xl tracking-tight text-slate-900">
          A study Bible that you can search and follow.
        </p>
        <p className="mt-4 text-lg tracking-tight text-slate-700">
          The site links more than 160,000 Scripture references. Each one
          opens the passage that it names.
        </p>
      </Container>
      <Container size="lg" className="mt-16">
        <ol role="list" className="-mx-3 grid grid-cols-1 gap-y-10 lg:grid-cols-3 lg:text-center xl:-mx-12 xl:divide-x xl:divide-slate-400/20">
          {features.map((feature) => (
            <li key={feature.title} className="grid auto-rows-min grid-cols-1 items-center gap-8 px-3 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-1 xl:px-12">
              <div className="relative h-48 overflow-hidden rounded-2xl bg-paper-2 shadow-lg sm:h-60 lg:h-56">
                <Image
                  src={feature.image}
                  alt={feature.alt}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  sizes="(min-width: 1280px) 21rem, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
              </div>
              <div>
                <h3 className="font-sans text-base font-medium tracking-tight text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
