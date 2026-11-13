import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Rich } from '../../components/Rich.tsx'
import { bookByCode, chapterNumbers } from '../../lib/data.ts'
import { serif, useColors } from '../../lib/theme.ts'

const ROMAN = ['', 'I', 'II', 'III', 'IV']

export default function BookScreen() {
  const c = useColors()
  const { code } = useLocalSearchParams<{ code: string }>()
  const book = bookByCode(code)
  const [more, setMore] = useState(false)
  if (!book) {
    return (
      <View style={[st.page, { backgroundColor: c.bg }]}>
        <Text style={{ color: c.ink }}>The app has no book with this name.</Text>
      </View>
    )
  }
  const noted = new Set(book.noted)
  const brown = new Set(book.brown)
  const intro = book.intro ?? []
  const shown = more ? intro : intro.slice(0, 1)
  const long = intro.length > 1 || JSON.stringify(intro).length > 600
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={st.page} contentInsetAdjustmentBehavior="automatic">
      <Stack.Screen options={{ title: book.name }} />
      {book.eb && <Text style={[st.eyebrow, { color: c.rubric }]}>{book.eb}</Text>}
      <Text style={[st.title, { color: c.ink }]} accessibilityRole="header">
        {book.name}
      </Text>
      {book.vol && <Text style={[st.source, { color: c.muted }]}>Volume {ROMAN[book.vol]} of the printed edition</Text>}

      {shown.map((p, i) => (
        <Text key={i} style={[st.intro, { color: c.ink }]} numberOfLines={more ? undefined : 5}>
          <Rich text={p} size={17} />
        </Text>
      ))}
      {long && (
        <Text style={[st.more, { color: c.accent }]} accessibilityRole="button" onPress={() => setMore(!more)}>
          {more ? 'Show less' : 'Read the introduction'}
        </Text>
      )}

      <Text style={[st.h2, { color: c.ink }]} accessibilityRole="header">
        {book.cn === 'Psalm' ? 'Psalms' : 'Chapters'}
      </Text>
      <View style={st.legend}>
        <View style={st.legendItem}>
          <View style={[st.swatch, { backgroundColor: c.accent }]} />
          <Text style={[st.legendText, { color: c.muted }]}>Brown’s notes</Text>
        </View>
        {book.brown.length > book.noted.length && (
          <View style={st.legendItem}>
            <View style={[st.swatch, { borderColor: c.accent, borderWidth: 1.5 }]} />
            <Text style={[st.legendText, { color: c.muted }]}>Margin references only</Text>
          </View>
        )}
        {book.brown.length < book.count && (
          <View style={st.legendItem}>
            <View style={[st.swatch, { borderColor: c.line, borderWidth: 1.5 }]} />
            <Text style={[st.legendText, { color: c.muted }]}>King James text only</Text>
          </View>
        )}
      </View>
      <View style={st.grid}>
        {chapterNumbers(book).map((n) => {
          const kind = noted.has(n) ? 'noted' : brown.has(n) ? 'brown' : 'kjv'
          return (
            <Pressable
              key={n}
              onPress={() => router.push({ pathname: '/read/[code]/[chapter]', params: { code: book.code, chapter: String(n) } })}
              accessibilityRole="button"
              accessibilityLabel={`${book.cn ?? 'Chapter'} ${n}${kind === 'noted' ? ', with notes' : ''}`}
              style={({ pressed }) => [
                st.cell,
                kind === 'noted'
                  ? { backgroundColor: c.accent }
                  : { borderWidth: 1.5, borderColor: kind === 'brown' ? c.accent : c.line },
                { opacity: pressed ? 0.7 : 1 },
              ]}>
              <Text style={[st.cellText, { color: kind === 'noted' ? c.bg : c.ink }]}>{n}</Text>
            </Pressable>
          )
        })}
      </View>
    </ScrollView>
  )
}

const st = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  eyebrow: { fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600', marginTop: 8 },
  title: { fontFamily: serif.semibold, fontSize: 30, lineHeight: 36, marginTop: 4 },
  source: { fontSize: 14, marginTop: 4, marginBottom: 12 },
  intro: { fontFamily: serif.regular, fontSize: 17, lineHeight: 26, marginBottom: 10 },
  more: { fontSize: 16, paddingVertical: 4 },
  h2: { fontFamily: serif.semibold, fontSize: 21, marginTop: 24, marginBottom: 8 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 16, rowGap: 6, marginBottom: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 14, height: 14, borderRadius: 4 },
  legendText: { fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: 52, height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 16, fontWeight: '600' },
})
