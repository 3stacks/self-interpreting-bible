import { Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { P, Page } from '../components/Prose.tsx'
import { usePrefs } from '../lib/prefs.tsx'
import { serif, TEXT_SIZES, useColors } from '../lib/theme.ts'

export default function Settings() {
  const c = useColors()
  const [prefs, update] = usePrefs()
  const scale = TEXT_SIZES[prefs.textSize]?.scale ?? 1
  const toggles = [
    {
      key: 'margin' as const,
      label: 'Margin references',
      hint: 'Show the references and the short notes from the margin under each verse.',
    },
    {
      key: 'measures' as const,
      label: 'Modern measures',
      hint: 'Show a modern equivalent after a biblical measure, for example a cubit. The printed book does not have these.',
    },
  ]
  return (
    <Page>
      <P muted>These settings stay on this device. Light and dark follow the setting of your device.</P>

      <Text style={[st.heading, { color: c.ink }]} accessibilityRole="header">
        Text size
      </Text>
      <View style={[st.segments, { borderColor: c.line }]}>
        {TEXT_SIZES.map((s, i) => {
          const selected = prefs.textSize === i
          return (
            <Pressable
              key={s.label}
              onPress={() => update({ textSize: i })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[st.segment, { backgroundColor: selected ? c.accent : 'transparent' }]}>
              <Text style={{ color: selected ? c.bg : c.ink, fontSize: 14 * s.scale, fontWeight: '600' }}>{s.label}</Text>
            </Pressable>
          )
        })}
      </View>
      <Text style={[st.sample, { color: c.ink, fontSize: 18 * scale, lineHeight: 18 * scale * 1.55 }]}>
        <Text style={{ color: c.rubric, fontSize: 12.5 * scale }}>1 </Text>
        In the beginning God created the heaven and the earth.
      </Text>

      {toggles.map((o) => (
        <View key={o.key} style={[st.option, { borderBottomColor: c.line }]}>
          <View style={st.text}>
            <Text style={[st.label, { color: c.ink }]}>{o.label}</Text>
            <Text style={{ color: c.muted, fontSize: 14, lineHeight: 20 }}>{o.hint}</Text>
          </View>
          <Switch
            value={prefs[o.key]}
            onValueChange={(v) => update({ [o.key]: v })}
            trackColor={{ true: c.accent }}
            accessibilityLabel={o.label}
          />
        </View>
      ))}
    </Page>
  )
}

const st = StyleSheet.create({
  heading: { fontSize: 18, fontWeight: '700', marginTop: 12, marginBottom: 10 },
  segments: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  sample: { fontFamily: serif.regular, marginTop: 14, marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  text: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
})
