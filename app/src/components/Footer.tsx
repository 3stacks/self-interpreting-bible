import { router } from 'expo-router'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { HEARERS, KOFI, PRECENTOR, WEBSITE } from '../lib/links.ts'
import { open } from '../lib/open.ts'
import { useColors } from '../lib/theme.ts'

/** The links at the end of the contents: the pages of this app, then the other apps. */
export function Footer() {
  const c = useColors()
  const link = (label: string, go: () => void) => (
    <Text key={label} style={[st.link, { color: c.accent }]} accessibilityRole="link" onPress={go}>
      {label}
    </Text>
  )
  return (
    <View style={st.footer}>
      <View style={st.row}>
        {link('Settings', () => router.push('/settings'))}
        {link('About', () => router.push('/about'))}
        {link('Privacy', () => router.push('/privacy'))}
      </View>
      <View style={st.row}>
        {link('Website', () => open(WEBSITE))}
        {link('Hearers', () => open(HEARERS))}
        {link('Precentor', () => open(PRECENTOR))}
        {/* The App Store does not allow a link to outside payments, so iOS does not show it. */}
        {Platform.OS !== 'ios' && link('Support on Ko-fi', () => open(KOFI))}
      </View>
    </View>
  )
}

const st = StyleSheet.create({
  footer: { marginTop: 32, gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 18, rowGap: 8 },
  link: { fontSize: 15, paddingVertical: 4 },
})
