import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Footer } from '../components/Footer.tsx'
import { BOOKS, bookByCode, bookStatus, chapterName, type Book } from '../lib/data.ts'
import { usePrefs } from '../lib/prefs.tsx'
import { serif, useColors } from '../lib/theme.ts'

const GROUPS: { t: Book['t']; title: string; note?: string }[] = [
  { t: 'ot', title: 'Old Testament' },
  { t: 'nt', title: 'New Testament' },
  {
    t: 'apoc',
    title: 'Apocrypha',
    note: 'The printed edition has these books in Volume III, with margin references and no notes. They are not part of the canon of Scripture.',
  },
]

export default function Contents() {
  const c = useColors()
  const [prefs] = usePrefs()
  const [lastCode, lastCh] = (prefs.last ?? '').split('/')
  const lastBook = bookByCode(lastCode)
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={st.page} contentInsetAdjustmentBehavior="automatic">
      <Text style={[st.eyebrow, { color: c.rubric }]}>John Brown of Haddington</Text>
      <Text style={[st.title, { color: c.ink }]} accessibilityRole="header">
        The Self-Interpreting Bible
      </Text>
      <Text style={[st.lead, { color: c.muted }]}>
        The King James Bible with the margin references, notes and reflections of John Brown of Haddington.
      </Text>

      {lastBook && +lastCh ? (
        <Pressable
          onPress={() => router.push({ pathname: '/read/[code]/[chapter]', params: { code: lastBook.code, chapter: lastCh } })}
          accessibilityRole="button"
          style={({ pressed }) => [st.continue, { backgroundColor: c.accent, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={[st.continueLabel, { color: c.bg }]}>Continue</Text>
          <Text style={[st.continueTitle, { color: c.bg }]}>{chapterName(lastBook, +lastCh)}</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => router.push({ pathname: '/read/[code]/[chapter]', params: { code: 'Gen', chapter: '1' } })}
          accessibilityRole="button"
          style={({ pressed }) => [st.continue, { backgroundColor: c.accent, opacity: pressed ? 0.8 : 1 }]}>
          <Text style={[st.continueLabel, { color: c.bg }]}>Start</Text>
          <Text style={[st.continueTitle, { color: c.bg }]}>Genesis 1</Text>
        </Pressable>
      )}

      {GROUPS.map((g) => (
        <View key={g.t}>
          <Text style={[st.group, { color: c.muted, borderBottomColor: c.line }]} accessibilityRole="header">
            {g.title.toUpperCase()}
          </Text>
          {g.note && <Text style={[st.note, { color: c.muted }]}>{g.note}</Text>}
          {BOOKS.filter((b) => b.t === g.t).map((b) => (
            <Pressable
              key={b.code}
              onPress={() => router.push({ pathname: '/book/[code]', params: { code: b.code } })}
              accessibilityRole="button"
              style={({ pressed }) => [st.row, { borderBottomColor: c.line, backgroundColor: pressed ? c.paper2 : 'transparent' }]}>
              <Text style={[st.name, { color: c.ink }]}>{b.name}</Text>
              <Text style={[st.status, { color: c.muted }]}>{bookStatus(b)}</Text>
            </Pressable>
          ))}
        </View>
      ))}
      <Footer />
    </ScrollView>
  )
}

const st = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  eyebrow: { fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600', marginTop: 8 },
  title: { fontFamily: serif.semibold, fontSize: 30, lineHeight: 36, marginTop: 4 },
  lead: { fontFamily: serif.regular, fontSize: 17, lineHeight: 25, marginTop: 8 },
  continue: { borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14, marginTop: 20 },
  continueLabel: { fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600', opacity: 0.85 },
  continueTitle: { fontFamily: serif.semibold, fontSize: 22, marginTop: 2 },
  group: { fontSize: 12, letterSpacing: 1.2, fontWeight: '600', marginTop: 32, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  note: { fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  name: { fontFamily: serif.regular, fontSize: 18, flexShrink: 1 },
  status: { fontSize: 13, textAlign: 'right' },
})
