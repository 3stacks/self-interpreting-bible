import Image, { type StaticImageData } from 'next/image'

import { Container } from '@/components/Container'
import { SectionHeading } from '@/components/SectionHeading'
import verseImage from '@/images/screens/verse.webp'
import popoverImage from '@/images/screens/popover.webp'
import notesImage from '@/images/screens/notes.webp'
import scanImage from '@/images/screens/scan.webp'

const parts: { title: string; description: string; image: StaticImageData; alt: string }[] = [
  {
    title: 'The text',
    description: 'The King James text of 1769, with the chapter summary at the top and a link to each verse.',
    image: verseImage,
    alt: 'John 3:16 and 17, with the margin references under each verse',
  },
  {
    title: 'The margin references',
    description: 'Brown’s references stand beside each verse. Point at a reference to read that passage at once.',
    image: popoverImage,
    alt: 'A popup with the text of 1 John 4:9, 10 and 19, opened from a margin reference',
  },
  {
    title: 'The notes',
    description: 'At the end of the chapter, the notes explain the hard words and verses. The reflections apply the chapter.',
    image: notesImage,
    alt: 'The notes on John 3, starting with verses 3, 5, 6 and 8',
  },
  {
    title: 'The scan',
    description: 'Each printed page has a button that opens its scan, so that you can check the text against the book.',
    image: scanImage,
    alt: 'Part of the scan of page 209 of Volume IV, with John 3 and the references in a narrow column',
  },
]

export function OnEachPage() {
  return (
    <section id="on-each-page" aria-labelledby="on-each-page-title" className="scroll-mt-14 py-16 sm:scroll-mt-32 sm:py-20 lg:py-32">
      <Container>
        <SectionHeading number="2" id="on-each-page-title">
          On each page
        </SectionHeading>
        <p className="mt-8 font-display text-4xl tracking-tight text-slate-900">
          Each chapter has the same four parts as the printed page.
        </p>
        <p className="mt-4 text-lg tracking-tight text-slate-700">
          The print packs the text, the references and the notes into narrow
          columns of small type. The site gives each part room, and it links
          them together.
        </p>
      </Container>
      <Container size="lg" className="mt-16">
        <ol role="list" className="grid grid-cols-1 gap-x-8 gap-y-10 [counter-reset:part] sm:grid-cols-2 lg:grid-cols-4">
          {parts.map((part) => (
            <li key={part.title} className="[counter-increment:part]">
              <div className="relative flex h-56 items-start justify-center overflow-hidden rounded-2xl bg-brand-600 px-6 pt-6 shadow-lg">
                <Image
                  src={part.image}
                  alt={part.alt}
                  className="w-full rounded-t-lg shadow-md"
                  sizes="(min-width: 1024px) 18rem, (min-width: 640px) 50vw, 100vw"
                />
              </div>
              <h3 className="mt-8 font-sans text-base font-medium tracking-tight text-slate-900 before:mb-2 before:block before:font-mono before:text-sm before:text-slate-500 before:content-[counter(part,decimal-leading-zero)]">
                {part.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{part.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}
