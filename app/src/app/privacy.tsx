import { A, H2, P, Page } from '../components/Prose.tsx'
import { ISSUES_URL, PRIVACY_URL } from '../lib/links.ts'

export default function Privacy() {
  return (
    <Page>
      <P>
        Haddington Bible collects no personal data. It has no account, no advertisements and no tracking. It has no
        analytics.
      </P>
      <H2>On your device</H2>
      <P>
        The app keeps your settings and the last chapter that you read on this device. It does not send them to us or to
        another company. When you delete the app, you delete them.
      </P>
      <P>
        The text of the Bible and of the notes is in the app, so the app works with no connection. The app connects to the
        internet only when you open a link, for example to the website, to Hearers or to Precentor. Those sites have their
        own privacy policies.
      </P>
      <H2>Questions</H2>
      <P>
        The full policy is at <A href={PRIVACY_URL}>haddingtonbible.org/privacy</A>. For a question, open an issue on{' '}
        <A href={ISSUES_URL}>GitHub</A>.
      </P>
    </Page>
  )
}
