import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { serif, useColors } from '../lib/theme.ts'

/** A sheet from the bottom of the screen, over the page. */
export function Sheet({ visible, title, onClose, children, actions }: {
  visible: boolean
  title: string
  onClose: () => void
  children?: ReactNode
  actions?: ReactNode
}) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={st.wrap}>
        <Pressable style={st.backdrop} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        <View style={[st.sheet, { backgroundColor: c.bg, borderColor: c.line, paddingBottom: 16 + insets.bottom }]}>
          <View style={[st.grip, { backgroundColor: c.line }]} />
          <View style={st.head}>
            <Text style={[st.title, { color: c.ink }]} accessibilityRole="header">
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <Text style={[st.close, { color: c.accent }]}>Close</Text>
            </Pressable>
          </View>
          {children && (
            <ScrollView style={st.body} contentContainerStyle={st.bodyIn}>
              {children}
            </ScrollView>
          )}
          {actions && <View style={st.actions}>{actions}</View>}
        </View>
      </View>
    </Modal>
  )
}

/** A full-width button in a sheet. */
export function SheetButton({ label, onPress, primary }: { label: string; onPress: () => void; primary?: boolean }) {
  const c = useColors()
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        st.button,
        { borderColor: c.accent, backgroundColor: primary ? c.accent : 'transparent', opacity: pressed ? 0.7 : 1 },
      ]}>
      <Text style={[st.buttonText, { color: primary ? c.bg : c.accent }]}>{label}</Text>
    </Pressable>
  )
}

const st = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 8,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  grip: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  title: { fontFamily: serif.semibold, fontSize: 20, flex: 1 },
  close: { fontSize: 16 },
  body: { flexGrow: 0 },
  bodyIn: { paddingBottom: 8 },
  actions: { gap: 10, marginTop: 12 },
  button: { borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
})
