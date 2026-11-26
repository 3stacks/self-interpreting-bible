import { type Metadata } from 'next'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { Footer } from '@/components/Footer'
import { GridPattern } from '@/components/GridPattern'
import { REPO_URL, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Terms',
  description: 'The terms of use of Haddington Bible. Haddington Bible is free, and we supply it as it is.',
  alternates: { canonical: '/terms/' },
}

const ISSUES = `${REPO_URL}/issues`

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 font-display text-3xl text-slate-900">{children}</h2>
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4">{children}</p>
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="text-brand-600 hover:text-brand-800">
      {children}
    </a>
  )
}

export default function TermsPage() {
  return (
    <>
      <header className="relative overflow-hidden bg-brand-600 text-white">
        <div className="absolute inset-0 text-white/10">
          <GridPattern x="50%" y="100%" />
        </div>
        <Container className="relative py-16 sm:py-24">
          <nav aria-label="Breadcrumb" className="font-sans text-sm text-brand-100">
            <Link href="/" className="hover:text-white">
              {SITE_NAME}
            </Link>{' '}
            <span aria-hidden="true">/</span> Terms
          </nav>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl">Terms</h1>
          <p className="mt-4 font-sans text-sm text-brand-100">Last change: 26 November 2026</p>
        </Container>
      </header>
      <main>
        <Container className="py-16 text-lg tracking-tight text-slate-700 sm:py-20">
          <p>
            Haddington Bible is free. These terms tell what you can expect from Haddington Bible and from us. These
            terms also apply to this website.
          </p>

          <H2>Who we are</H2>
          <P>
            Alpine Hills Consulting Pty Ltd publishes Haddington Bible. The company is in Australia. In these terms,
            “we” and “us” mean this company.
          </P>

          <H2>Use of Haddington Bible</H2>
          <P>You can use Haddington Bible at no cost. You need no account.</P>
          <P>
            If you use Haddington Bible, you agree to these terms. If you do not agree, do not use Haddington Bible.
          </P>

          <H2>No warranty</H2>
          <P>
            We supply Haddington Bible as it is. We do not promise that it has no errors, or that it is always
            available.
          </P>
          <P>
            To the extent that the law permits, we are not liable for loss or damage from your use of Haddington Bible.
          </P>
          <P>
            These terms do not remove rights that you have under the Australian Consumer Law, or under other law that an
            agreement cannot remove.
          </P>

          <H2>Links to other sites</H2>
          <P>Haddington Bible links to other sites and apps. We do not control them. Their own terms apply.</P>

          <H2>Privacy</H2>
          <P>
            The <A href="/privacy/">privacy policy</A> tells what Haddington Bible keeps, and where.
          </P>

          <H2>The law</H2>
          <P>The law of Australia applies to these terms.</P>

          <H2>Changes and contact</H2>
          <P>
            If these terms change, this page shows the new terms and the date of the change. For a question, open an
            issue on <A href={ISSUES}>GitHub</A>.
          </P>
        </Container>
      </main>
      <Footer />
    </>
  )
}
