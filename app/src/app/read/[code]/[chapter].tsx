import { router, Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native'
import { Rich } from '../../../components/Rich.tsx'
import { Sheet, SheetButton } from '../../../components/Sheet.tsx'
import { bookByCode, chapterName, CONVERSION_NOTE, loadChapter, slugOf } from '../../../lib/data.ts'
import { memoriseInHearers, onWebsite, singInPrecentor } from '../../../lib/links.ts'
import { open } from '../../../lib/open.ts'
import { usePrefs } from '../../../lib/prefs.tsx'
import { serif, TEXT_SIZES, useColors } from '../../../lib/theme.ts'

export default function ChapterScreen() {
  const c = useColors()
  const [prefs, update] = usePrefs()
  const params = useLocalSearchParams<{ code: string; chapter: string; v?: string }>()
  const book = bookByCode(params.code)
  const n = Number(params.chapter)
  const chapter = useMemo(() => (book ? loadChapter(book.code, n) : undefined), [book, n])
  const scale = TEXT_SIZES[prefs.textSize]?.scale ?? 1
  const scroll = useRef<ScrollViewInstance>(null)
  const pos = useRef(new Map<string, number>())
  const target = useRef(params.v ? `v${params.v}` : null)
  const [verse, setVerse] = useState<number | null>(null)

  useEffect(() => {
    if (book && chapter) update({ last: `${book.code}/${n}` })
  }, [book, chapter, n, update])

  if (!book || !chapter) {
    return (
      <View style={[st.page, { backgroundColor: c.bg, flex: 1 }]}>
        <Stack.Screen options={{ title: 'Not found' }} />
        <Text style={{ color: c.ink, fontSize: 17 }}>The app has no chapter at this address.</Text>
      </View>
    )
  }

  const name = chapterName(book, n)
  const noteFor = new Map<number, number>()
  chapter.n?.forEach(([, v], i) => {
    if (v && !noteFor.has(v)) noteFor.set(v, i)
  })
  const prev = n > book.start ? n - 1 : null
  const next = n < book.start + book.count - 1 ? n + 1 : null
  const go = (to: number) => router.replace({ pathname: '/read/[code]/[chapter]', params: { code: book.code, chapter: String(to) } })
  const onItemLayout = (key: string, e: LayoutChangeEvent) => {
    const y = e.nativeEvent.layout.y
    pos.current.set(key, y)
    if (target.current === key) {
      target.current = null
      setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, y - 12), animated: false }), 50)
    }
  }
  const scrollTo = (key: string) => {
    const y = pos.current.get(key)
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - 12), animated: true })
  }

  const verseSize = 18 * scale
  const marginSize = 14 * scale
  const noteSize = 17 * scale
  const canon = book.t !== 'apoc'

  let status: string | null = null
  if (chapter.k) status = 'Brown’s edition of this chapter is not in the app yet. This page shows the King James text.'
  else if (!chapter.n?.length && book.t === 'apoc') status = 'The printed edition gives margin references for this book. It has no notes on the Apocrypha.'
  else if (!chapter.n?.length) status = 'Brown’s notes on this chapter are not in the transcription yet. The margin references are under each verse.'

  return (
    <>
      <Stack.Screen
        options={{
          title: name,
          headerRight: () => (
            <Pressable onPress={() => router.push('/settings')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Settings">
              <Text style={{ color: c.accent, fontSize: 18, fontFamily: serif.regular }}>Aa</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView ref={scroll} style={{ backgroundColor: c.bg }} contentContainerStyle={st.page} contentInsetAdjustmentBehavior="automatic">
        {n === book.start && book.eb && <Text style={[st.eyebrow, { color: c.rubric }]}>{book.eb}</Text>}
        <Text style={[st.title, { color: c.ink }]} accessibilityRole="header">
          {name}
        </Text>
        {chapter.p && <Text style={[st.source, { color: c.muted }]}>{chapter.p}</Text>}
        {chapter.s && (
          <Text style={[st.summary, { color: c.muted, fontSize: 16 * scale, lineHeight: 24 * scale }]}>
            <Rich text={chapter.s} size={16 * scale} />
          </Text>
        )}
        {status && (
          <View style={[st.status, { backgroundColor: c.paper2 }]}>
            <Text style={{ color: c.muted, fontSize: 14, lineHeight: 20 }}>{status}</Text>
          </View>
        )}
        <View style={st.tools}>
          {!!chapter.n?.length && (
            <Text style={[st.tool, { color: c.accent }]} accessibilityRole="link" onPress={() => scrollTo('notes')}>
              Notes ↓
            </Text>
          )}
          {book.code === 'Ps' && (
            <Text style={[st.tool, { color: c.accent }]} accessibilityRole="link" onPress={() => open(singInPrecentor(n))}>
              Sing Psalm {n} in Precentor
            </Text>
          )}
        </View>
        {chapter.t && (
          <Text style={[st.psTitle, { color: c.muted, fontSize: 15 * scale, lineHeight: 22 * scale }]}>
            <Rich text={chapter.t} size={15 * scale} />
          </Text>
        )}

        {chapter.v.map(([v, text, margin, heading, kjv]) => {
          const hasNote = noteFor.has(v)
          return (
            <View key={v} onLayout={(e) => onItemLayout(`v${v}`, e)} style={st.verse}>
              {heading && <Text style={[st.heading, { color: c.rubric }]}>{heading}</Text>}
              <Text style={[st.vt, { color: c.ink, fontSize: verseSize, lineHeight: verseSize * 1.55 }]}>
                <Text
                  onPress={() => setVerse(v)}
                  accessibilityRole="button"
                  accessibilityLabel={`Verse ${v}${hasNote ? ', with a note' : ''}`}
                  style={[st.vn, { color: c.rubric, fontSize: 12.5 * scale, textDecorationLine: hasNote ? 'underline' : 'none' }]}>
                  {v}
                  {hasNote ? '✎' : ''}
                </Text>{' '}
                <Rich text={text} size={verseSize} />
                {kjv ? <Text style={{ color: c.muted, fontSize: 11 * scale }}> (KJV)</Text> : null}
              </Text>
              {prefs.margin && !!margin?.length && (
                <View style={[st.margin, { borderLeftColor: c.line }]}>
                  {margin.map(([key, m, date], i) => (
                    <View key={i}>
                      {date && <Text style={[st.date, { color: c.muted, fontSize: 12 * scale }]}>{date}</Text>}
                      <Text style={[st.ment, { color: c.muted, fontSize: marginSize, lineHeight: marginSize * 1.45 }]}>
                        <Text style={{ color: c.ink, fontWeight: '600' }}>{key} </Text>
                        <Rich text={m} size={marginSize} />
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )
        })}

        {prefs.margin && !!chapter.lm?.length && (
          <View style={[st.loose, { borderTopColor: c.line }]}>
            <Text style={[st.h2, { color: c.ink }]} accessibilityRole="header">
              Other margin entries
            </Text>
            {chapter.lm.map(([key, m, v], i) => (
              <Text key={i} style={[st.ment, { color: c.muted, fontSize: marginSize, lineHeight: marginSize * 1.45 }]}>
                <Text style={{ color: c.ink, fontWeight: '600' }}>{key} </Text>
                <Rich text={m} size={marginSize} />
                {v ? ` (ver. ${v})` : ''}
              </Text>
            ))}
          </View>
        )}

        {!!chapter.n?.length && (
          <View onLayout={(e) => onItemLayout('notes', e)} style={[st.notes, { borderTopColor: c.line }]}>
            <Text style={[st.h2, { color: c.ink }]} accessibilityRole="header">
              Notes
            </Text>
          </View>
        )}
        {chapter.n?.map(([text, , kind], i) => (
          <View key={i} onLayout={(e) => onItemLayout(`n${i}`, e)} style={kind === 1 ? [st.reflections, { borderLeftColor: c.rubric }] : undefined}>
            <Text style={[st.note, { color: c.ink, fontSize: noteSize, lineHeight: noteSize * 1.6 }]}>
              <Rich text={text} size={noteSize} />
            </Text>
          </View>
        ))}

        {chapter.m && prefs.measures && <Text style={[st.conv, { color: c.muted, borderTopColor: c.line }]}>{CONVERSION_NOTE}</Text>}

        <View style={[st.pager, { borderTopColor: c.line }]}>
          {prev ? (
            <Pressable onPress={() => go(prev)} accessibilityRole="button" style={st.pagerItem}>
              <Text style={[st.pagerLabel, { color: c.muted }]}>Previous</Text>
              <Text style={[st.pagerTitle, { color: c.accent }]}>{chapterName(book, prev)}</Text>
            </Pressable>
          ) : (
            <View />
          )}
          {next ? (
            <Pressable onPress={() => go(next)} accessibilityRole="button" style={[st.pagerItem, { alignItems: 'flex-end' }]}>
              <Text style={[st.pagerLabel, { color: c.muted }]}>Next</Text>
              <Text style={[st.pagerTitle, { color: c.accent }]}>{chapterName(book, next)}</Text>
            </Pressable>
          ) : (
            <View />
          )}
        </View>
      </ScrollView>

      <Sheet
        visible={verse !== null}
        title={verse !== null ? `${name}:${verse}` : ''}
        onClose={() => setVerse(null)}
        actions={
          verse !== null && (
            <>
              {noteFor.has(verse) && (
                <SheetButton
                  primary
                  label="Read Brown’s note"
                  onPress={() => {
                    const i = noteFor.get(verse)
                    setVerse(null)
                    scrollTo(`n${i}`)
                  }}
                />
              )}
              {canon && <SheetButton label="Memorise this verse in Hearers" onPress={() => open(memoriseInHearers(book.code, n, verse))} />}
              <SheetButton label="Open on the website" onPress={() => open(`${onWebsite(slugOf(book), n)}#v${n}-${verse}`)} />
            </>
          )
        }
      />
    </>
  )
}

const st = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  eyebrow: { fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600', marginTop: 8 },
  title: { fontFamily: serif.semibold, fontSize: 30, lineHeight: 36, marginTop: 4 },
  source: { fontSize: 13, marginTop: 2 },
  summary: { fontFamily: serif.italic, marginTop: 12 },
  status: { borderRadius: 8, padding: 12, marginTop: 14 },
  tools: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: 6, marginTop: 12, marginBottom: 8 },
  tool: { fontSize: 15, paddingVertical: 4 },
  psTitle: { fontFamily: serif.italic, marginBottom: 8 },
  verse: { marginTop: 10 },
  heading: { fontSize: 13, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginTop: 14, marginBottom: 4 },
  vt: { fontFamily: serif.regular },
  vn: { fontFamily: serif.semibold },
  margin: { borderLeftWidth: 1, paddingLeft: 12, marginTop: 4, marginLeft: 2 },
  date: { fontStyle: 'italic', marginBottom: 2 },
  ment: { marginBottom: 4 },
  loose: { marginTop: 24, borderTopWidth: StyleSheet.hairlineWidth },
  notes: { marginTop: 32, borderTopWidth: 3, paddingTop: 4 },
  h2: { fontFamily: serif.semibold, fontSize: 22, marginTop: 12, marginBottom: 8 },
  note: { fontFamily: serif.regular, marginBottom: 12 },
  reflections: { borderLeftWidth: 3, paddingLeft: 14, marginTop: 16 },
  conv: { fontSize: 13, lineHeight: 19, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 24 },
  pager: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, marginTop: 32, paddingTop: 16 },
  pagerItem: { paddingVertical: 4 },
  pagerLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  pagerTitle: { fontFamily: serif.semibold, fontSize: 18, marginTop: 2 },
})
