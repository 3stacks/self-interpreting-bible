import { type Metadata, type Viewport } from 'next'
import { IBM_Plex_Sans_Condensed, IM_Fell_English, Source_Serif_4 } from 'next/font/google'
import clsx from 'clsx'

import { ANALYTICS_LOADER } from '@/lib/analytics'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import '@/styles/tailwind.css'

const fell = IM_Fell_English({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-fell',
})
const serif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-source-serif',
})
const plex = IBM_Plex_Sans_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-plex',
})

const description =
  'Read John Brown of Haddington’s Self-Interpreting Bible free online. The King James text with the margin references, notes and reflections, transcribed from the four-volume edition, with a scan of every page.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} by John Brown of Haddington: free online`,
    template: `%s · ${SITE_NAME}`,
  },
  description,
  applicationName: SITE_NAME,
  authors: [{ name: 'Luke Boyle' }],
  keywords: [
    'Self-Interpreting Bible',
    'John Brown of Haddington',
    'Bible commentary',
    'King James Version',
    'margin references',
    'Reformed commentary',
    'Scottish Presbyterian',
    'public domain commentary',
  ],
  icons: { icon: '/icon.svg' },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_GB',
    url: '/',
    title: `${SITE_NAME} by John Brown of Haddington`,
    description,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: `${SITE_NAME}, by John Brown of Haddington` }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#27407a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={clsx('h-full scroll-smooth bg-paper antialiased', fell.variable, serif.variable, plex.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ANALYTICS_LOADER }} />
      </head>
      <body className="flex min-h-full flex-col font-serif text-slate-800">{children}</body>
    </html>
  )
}
