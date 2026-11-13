import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { open } from '../lib/open.ts'
import { serif, useColors } from '../lib/theme.ts'

// Text pages: About, Privacy and Settings.

export function Page({ children }: { children: ReactNode }) {
  const c = useColors()
  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={st.page} contentInsetAdjustmentBehavior="automatic">
      {children}
    </ScrollView>
  )
}

export function H2({ children }: { children: ReactNode }) {
  const c = useColors()
  return (
    <Text style={[st.h2, { color: c.ink }]} accessibilityRole="header">
      {children}
    </Text>
  )
}

export function P({ children, muted }: { children: ReactNode; muted?: boolean }) {
  const c = useColors()
  return <Text style={[st.p, { color: muted ? c.muted : c.ink }]}>{children}</Text>
}

export function Li({ children }: { children: ReactNode }) {
  const c = useColors()
  return (
    <View style={st.li}>
      <Text style={[st.p, st.bullet, { color: c.muted }]}>•</Text>
      <Text style={[st.p, st.flex, { color: c.ink }]}>{children}</Text>
    </View>
  )
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  const c = useColors()
  return (
    <Text style={{ color: c.accent }} accessibilityRole="link" onPress={() => open(href)}>
      {children}
    </Text>
  )
}

export function I({ children }: { children: ReactNode }) {
  return <Text style={{ fontFamily: serif.italic }}>{children}</Text>
}

const st = StyleSheet.create({
  page: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48, maxWidth: 720, width: '100%', alignSelf: 'center' },
  h2: { fontFamily: serif.semibold, fontSize: 21, lineHeight: 27, marginTop: 24, marginBottom: 6 },
  p: { fontFamily: serif.regular, fontSize: 17, lineHeight: 26, marginBottom: 10 },
  li: { flexDirection: 'row', paddingLeft: 4 },
  bullet: { width: 22 },
  flex: { flex: 1 },
})
