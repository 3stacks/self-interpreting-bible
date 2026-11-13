import { type Metadata } from 'next'
import Link from 'next/link'

import { Container } from '@/components/Container'
import { Footer } from '@/components/Footer'
import { GridPattern } from '@/components/GridPattern'
import { REPO_URL, SITE_NAME } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'The Self-Interpreting Bible collects no personal data. The website and the Haddington Bible app have no account, no advertisements and no tracking.',
  alternates: { canonical: '/privacy/' },
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

export default function PrivacyPage() {
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
            <span aria-hidden="true">/</span> Privacy
          </nav>
          <h1 className="mt-6 font-display text-5xl sm:text-6xl">Privacy</h1>
          <p className="mt-4 font-sans text-sm text-brand-100">Last change: 13 November 2026</p>
        </Container>
      </header>
      <main>
        <Container className="py-16 text-lg tracking-tight text-slate-700 sm:py-20">
          <p>
            The Self-Interpreting Bible collects no personal data. The website and the Haddington Bible app have no
            account, no advertisements and no tracking. This page tells what each part keeps, and where.
          </p>

          <H2>The iPhone and Android app</H2>
          <P>
            The Haddington Bible app sends no data to us or to another company. It has no analytics. Your settings and
            the last chapter that you read stay on your device. When you delete the app, you delete them.
          </P>
          <P>
            The text of the Bible and of the notes is in the app, so the app works with no connection. The app connects
            to the internet only when you open a link, for example to this website, to Hearers or to Precentor. Those
            sites have their own privacy policies.
          </P>

          <H2>The website</H2>
          <P>
            The website counts visits with Umami. Umami uses no cookies and does not identify you. It records the page,
            the site that sent you, the type of browser and device, and the country. It does not keep your IP address.
            The counter loads only after your first tap, key or scroll. Analytics counts only the public site,
            haddingtonbible.org.
          </P>
          <P>
            The website keeps a few choices in the storage of your browser, on your device. An example is how the
            years show (A.M. or B.C.). We do not receive them.
          </P>
          <P>
            Cloudflare hosts the website. Cloudflare processes each visit, as each web host does, to deliver the page and
            to protect the site. Read the <A href="https://www.cloudflare.com/privacypolicy/">privacy policy of Cloudflare</A>.
          </P>

          <H2>Gifts</H2>
          <P>
            On the web and on Android, you can give a gift on Ko-fi. Ko-fi and its payment provider process the gift. We
            receive your name and your message only if you give them to Ko-fi.
          </P>

          <H2>Children</H2>
          <P>The Self-Interpreting Bible collects no data from anyone, so it collects no data from children.</P>

          <H2>Changes and contact</H2>
          <P>
            If this policy changes, this page shows the new policy and the date of the change. For a question, open an
            issue on <A href={ISSUES}>GitHub</A>.
          </P>
        </Container>
      </main>
      <Footer />
    </>
  )
}
