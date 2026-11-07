import { CheckIcon } from '@/components/CheckIcon'
import { Container } from '@/components/Container'
import { bookCount, START_URL, totalChapters } from '@/lib/site'

export function Introduction() {
  return (
    <section id="introduction" aria-label="Introduction" className="pt-20 pb-16 sm:pb-20 md:pt-36 lg:py-32">
      <Container className="text-lg tracking-tight text-slate-700">
        <p className="font-display text-4xl tracking-tight text-slate-900">
          Scripture is the best interpreter of Scripture. Brown built a whole
          Bible on that rule.
        </p>
        <p className="mt-4">
          John Brown was a Scottish minister and teacher of divinity. In 1778 he
          published a Bible that explains itself. Beside each verse he put
          references to other passages that make the verse clear. After each
          chapter he added notes that explain the hard words, and reflections
          that apply the chapter to the reader.
        </p>
        <p className="mt-4">
          Many editions followed in Scotland, England and America. This site
          puts the full text on the web, so that you can read it on any device
          and follow every reference with one tap.
        </p>
        <ul role="list" className="mt-8 space-y-3">
          {[
            `${bookCount} books and ${totalChapters.toLocaleString('en-GB')} chapters, from Genesis to Revelation, with the Apocrypha`,
            'The margin references beside each verse, with the King James text of each reference in a popup',
            'Brown’s notes and reflections at the end of each chapter',
            'A scan of the printed page beside every page of the text',
            'The tables, essays, engravings and metrical Psalms of the printed volumes',
          ].map((feature) => (
            <li key={feature} className="flex">
              <CheckIcon className="h-8 w-8 flex-none fill-brand-500" />
              <span className="ml-4">{feature}</span>
            </li>
          ))}
        </ul>
        <p className="mt-10 font-sans">
          <a href={START_URL} className="text-base font-medium text-brand-600 hover:text-brand-800">
            Read Genesis 1 <span aria-hidden="true">&rarr;</span>
          </a>
        </p>
      </Container>
    </section>
  )
}
