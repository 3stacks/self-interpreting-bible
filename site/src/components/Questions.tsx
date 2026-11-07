import { Container } from '@/components/Container'
import { SectionHeading } from '@/components/SectionHeading'
import { FAQ } from '@/lib/faq'

export function Questions() {
  return (
    <section id="questions" aria-labelledby="questions-title" className="scroll-mt-14 py-16 sm:scroll-mt-32 sm:py-20 lg:py-32">
      <Container>
        <SectionHeading number="5" id="questions-title">
          Questions
        </SectionHeading>
        <p className="mt-8 font-display text-4xl tracking-tight text-slate-900">Common questions</p>
        <dl className="mt-10 divide-y divide-slate-300/50">
          {FAQ.map(({ q, a }) => (
            <div key={q} className="py-6">
              <dt className="font-sans text-lg font-medium tracking-tight text-slate-900">{q}</dt>
              <dd className="mt-2 text-base text-slate-700">{a}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
