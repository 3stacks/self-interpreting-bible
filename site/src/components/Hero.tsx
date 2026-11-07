import Image from 'next/image'

import { Button } from '@/components/Button'
import { GridPattern } from '@/components/GridPattern'
import { CONTENTS_URL, START_URL } from '@/lib/site'
import heroImage from '@/images/screens/hero.webp'

function Verse() {
  return (
    <figure className="relative mx-auto max-w-md text-center lg:mx-0 lg:text-left">
      <blockquote>
        <p className="font-display text-2xl text-slate-900 italic">
          “Which things also we speak, not in the words which man’s wisdom
          teacheth, but which the Holy Ghost teacheth; comparing spiritual
          things with spiritual.”
        </p>
      </blockquote>
      <figcaption className="mt-2 font-sans text-sm tracking-wide text-slate-500 uppercase">
        <strong className="font-medium text-rubric">1 Corinthians 2:13</strong>
      </figcaption>
    </figure>
  )
}

export function Hero() {
  return (
    <header className="overflow-hidden bg-paper-2 lg:bg-transparent lg:px-5">
      <div className="mx-auto grid max-w-6xl grid-cols-1 grid-rows-[auto_1fr] gap-y-16 pt-16 md:pt-20 lg:grid-cols-12 lg:gap-y-20 lg:px-3 lg:pt-20 lg:pb-36 xl:py-32">
        <div className="relative flex items-end lg:col-span-5 lg:row-span-2">
          <div className="absolute -top-20 right-1/2 -bottom-12 left-0 z-10 rounded-br-6xl bg-brand-600 text-white/10 md:bottom-8 lg:-inset-y-32 lg:right-full lg:left-[-100vw] lg:-mr-40">
            <GridPattern x="100%" y="100%" patternTransform="translate(112 64)" />
          </div>
          <div className="relative z-10 mx-auto flex w-64 overflow-hidden rounded-3xl bg-slate-600 shadow-xl ring-8 ring-slate-900 md:w-72 lg:w-auto lg:max-w-xs">
            <Image
              className="w-full"
              src={heroImage}
              alt="John 3 on a phone: the chapter summary, the verses, and the margin references below each verse"
              priority
            />
          </div>
        </div>
        <div className="relative px-4 sm:px-6 lg:col-span-7 lg:pr-0 lg:pb-14 lg:pl-16 xl:pl-20">
          <div className="hidden lg:absolute lg:-top-32 lg:right-[-100vw] lg:bottom-0 lg:left-[-100vw] lg:block lg:bg-paper-2" />
          <Verse />
        </div>
        <div className="bg-paper pt-16 lg:col-span-7 lg:bg-transparent lg:pt-0 lg:pl-16 xl:pl-20">
          <div className="mx-auto px-4 sm:px-6 md:max-w-2xl md:px-4 lg:px-0">
            <p className="font-sans text-sm font-medium tracking-[0.14em] text-rubric uppercase">
              John Brown of Haddington
            </p>
            <h1 className="mt-3 font-display text-5xl text-slate-900 sm:text-6xl">
              The Self-Interpreting Bible, free to read online.
            </h1>
            <p className="mt-6 text-2xl leading-9 text-slate-600">
              The King James Bible with the margin references, notes and
              reflections of John Brown of Haddington. Every page comes from
              the four printed volumes, and every page links to its scan.
            </p>
            <div className="mt-8 flex flex-wrap gap-4 font-sans">
              <Button href={START_URL} color="blue" data-event="Start reading" data-event-label="hero">
                Start at Genesis 1
              </Button>
              <Button href={CONTENTS_URL} variant="outline" color="blue" data-event="Contents" data-event-label="hero">
                See the contents
              </Button>
            </div>
            <p className="mt-4 font-sans text-base tracking-tight text-slate-500">
              Free. No account. No advertisements.
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
