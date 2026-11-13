import { router } from 'expo-router'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { StyleSheet, Text } from 'react-native'
import { parseRef, refLabel, refVerses } from '../lib/data.ts'
import { usePrefs } from '../lib/prefs.tsx'
import { serif, TEXT_SIZES, useColors } from '../lib/theme.ts'
import { Sheet, SheetButton } from './Sheet.tsx'

const RefContext = createContext<(id: string) => void>(() => {})

/** Use the function that opens the KJV text of a reference id, such as "Isa.9.6-7". */
export const useRefSheet = () => useContext(RefContext)

export function RefSheetProvider({ children }: { children: ReactNode }) {
  const c = useColors()
  const [prefs] = usePrefs()
  const scale = TEXT_SIZES[prefs.textSize]?.scale ?? 1
  const [id, setId] = useState<string | null>(null)
  const ref = useMemo(() => (id ? parseRef(id) : undefined), [id])
  const text = useMemo(() => (ref ? refVerses(ref) : null), [ref])
  const show = useCallback((next: string) => setId(next), [])
  const close = () => setId(null)
  const read = () => {
    if (!ref) return
    const first = ref.ranges?.[0][0]
    close()
    router.push({
      pathname: '/read/[code]/[chapter]',
      params: { code: ref.book.code, chapter: String(ref.chapter), ...(first ? { v: String(first) } : {}) },
    })
  }
  return (
    <RefContext.Provider value={show}>
      {children}
      <Sheet
        visible={!!ref}
        title={ref ? `${refLabel(ref)} · KJV` : ''}
        onClose={close}
        actions={ref && <SheetButton primary label={`Read ${ref.book.cn ?? ref.book.name} ${ref.chapter}`} onPress={read} />}>
        {text?.verses.map(([v, t]) => (
          <Text key={v} style={[st.verse, { color: c.ink, fontSize: 17 * scale, lineHeight: 26 * scale }]}>
            <Text style={[st.num, { color: c.rubric, fontSize: 12 * scale }]}>{v} </Text>
            {t}
          </Text>
        ))}
        {text?.more && <Text style={[st.verse, { color: c.muted }]}>…</Text>}
      </Sheet>
    </RefContext.Provider>
  )
}

const st = StyleSheet.create({
  verse: { fontFamily: serif.regular, marginBottom: 8 },
  num: { fontFamily: undefined, fontWeight: '600' },
})
