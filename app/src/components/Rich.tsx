import type { ReactNode } from 'react'
import { Text, type TextStyle } from 'react-native'
import { FLAG, type Rich as RichText } from '../lib/data.ts'
import { usePrefs } from '../lib/prefs.tsx'
import { serif, useColors } from '../lib/theme.ts'
import { useRefSheet } from './RefSheet.tsx'

/**
 * A rich text inside a <Text>: italics, bold, small capitals, margin keys, footnote marks,
 * modern measures and scripture references. A tap on a reference opens the KJV text in a sheet.
 */
export function Rich({ text, size, keys = true }: { text: RichText; size: number; keys?: boolean }) {
  const c = useColors()
  const [prefs] = usePrefs()
  const showRef = useRefSheet()
  const out: ReactNode[] = []
  text.forEach((s, i) => {
    if (typeof s === 'string') {
      out.push(s)
      return
    }
    const [t, flags, ref] = s
    if (flags & FLAG.measure) {
      if (!prefs.measures) return
      out.push(
        <Text key={i} style={{ fontFamily: undefined, fontSize: size * 0.78, color: c.muted }} accessibilityLabel={`Modern equivalent: ${t}`}>
          {` ${t}`}
        </Text>,
      )
      return
    }
    if (flags & (FLAG.key | FLAG.fn)) {
      if (!keys || (flags & FLAG.key && !prefs.margin)) return
      out.push(
        <Text key={i} style={{ fontFamily: undefined, fontSize: size * 0.62, color: flags & FLAG.fn ? c.rubric : c.muted }}>
          {t}
        </Text>,
      )
      return
    }
    const italic = !!(flags & FLAG.i)
    const bold = !!(flags & FLAG.b)
    const style: TextStyle = {
      ...(italic || bold ? { fontFamily: bold ? (italic ? serif.semiboldItalic : serif.semibold) : serif.italic } : {}),
      ...(flags & FLAG.sc ? { fontVariant: ['small-caps'], letterSpacing: 0.4 } : {}),
    }
    if (flags & FLAG.unsure) {
      out.push(
        <Text key={i} style={{ color: c.rubric }} accessibilityLabel="uncertain reading">
          [?]
        </Text>,
      )
      return
    }
    if (ref) {
      out.push(
        <Text key={i} style={[style, { color: c.accent }]} accessibilityRole="link" onPress={() => showRef(ref)} suppressHighlighting={false}>
          {t}
        </Text>,
      )
      return
    }
    out.push(
      <Text key={i} style={style}>
        {t}
      </Text>,
    )
  })
  return <>{out}</>
}
