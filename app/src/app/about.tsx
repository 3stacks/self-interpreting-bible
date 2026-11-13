import { Platform, StyleSheet, Text, View } from 'react-native'
import { A, H2, I, Li, P, Page } from '../components/Prose.tsx'
import { HEARERS, KOFI, PRECENTOR, REPO_URL, WEBSITE } from '../lib/links.ts'
import { useColors } from '../lib/theme.ts'

function Credit({ term, children }: { term: string; children: React.ReactNode }) {
  const c = useColors()
  return (
    <View style={st.credit}>
      <Text style={[st.term, { color: c.ink }]}>{term}</Text>
      <Text style={[st.def, { color: c.muted }]}>{children}</Text>
    </View>
  )
}

export default function About() {
  return (
    <Page>
      <H2>The book</H2>
      <P>
        <I>The Self-Interpreting Bible</I> is an edition of the King James Bible by John Brown of Haddington. It was first
        published at Edinburgh in 1778. Beside each verse, Brown put references to other passages that explain it. After
        each chapter, he added notes and reflections. The name comes from the rule that Scripture is its own best
        interpreter.
      </P>
      <H2>The editor</H2>
      <P>
        John Brown (1722 to 1787) was a Scottish minister and teacher of divinity. As a shepherd boy, he taught himself
        Latin, Greek and Hebrew. He was the minister of the Associate congregation at Haddington, East Lothian, for 36
        years.
      </P>
      <H2>This edition</H2>
      <P>
        The text comes from a later edition in four volumes, the New Self-Interpreting Bible Library. It keeps Brown’s
        references, notes and reflections. It adds notes by Henry Cooke, marked “C.”, and comments on places by Josiah L.
        Porter, marked “P.”.
      </P>
      <P>
        The app shows each verse with its margin references. Tap a reference to read the passage. Tap a verse number to
        open Brown’s note on that verse, or to memorise the verse in Hearers. A chapter that is not in the transcription
        yet shows the King James text. The contents tell which chapters have notes.
      </P>
      <P>
        A small question mark in brackets marks a word that the scan does not show clearly. To see the scan of each page,
        use the <A href={WEBSITE}>website</A>.
      </P>

      <H2>Sources and licences</H2>
      <Credit term="The printed book">
        The New Self-Interpreting Bible Library. The book is in the public domain.
      </Credit>
      <Credit term="The transcription">
        Transcribed from scans of the printed pages for haddingtonbible.org. Anyone may read it and quote it. The source is
        on <A href={REPO_URL}>GitHub</A>.
      </Credit>
      <Credit term="King James Version">
        The text of the references, and of each chapter that is not in the transcription yet. From thiagobodruk/bible.
        Public domain.
      </Credit>
      <Credit term="Modern measures">
        The equivalents in square brackets are not in the printed book. They use common scholarly estimates.
      </Credit>

      <H2>Other free apps</H2>
      <Li>
        <A href={HEARERS}>Hearers</A>: learn the catechism and Scripture by heart.
      </Li>
      <Li>
        <A href={PRECENTOR}>Precentor</A>: sing the Psalms of the 1650 Scottish Psalter.
      </Li>

      <H2>Support</H2>
      {/* The App Store does not allow a link to outside payments, so iOS does not show it. */}
      <P>
        Haddington Bible is free and has no advertisements.
        {Platform.OS !== 'ios' && (
          <>
            {' '}
            If it helps you, you can support it on <A href={KOFI}>Ko-fi</A>.
          </>
        )}
      </P>
    </Page>
  )
}

const st = StyleSheet.create({
  credit: { marginTop: 12 },
  term: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  def: { fontSize: 15, lineHeight: 22 },
})
