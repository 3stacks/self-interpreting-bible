import { useColorScheme } from 'react-native'

// The same colours as the website (assets/site.css). The accent is the blue of the cloth binding.
const light = {
  bg: '#f5f6f1',
  card: '#ffffff',
  paper2: '#eceee6',
  ink: '#1c2126',
  muted: '#5a646d',
  line: '#d3d8cd',
  accent: '#27407a',
  rubric: '#9e2a2b',
  highlight: '#f1e3a6',
}
export type Colors = typeof light
const dark: Colors = {
  bg: '#15181c',
  card: '#1d2126',
  paper2: '#1d2126',
  ink: '#e4e2da',
  muted: '#9aa2aa',
  line: '#30363d',
  accent: '#9fb4ee',
  rubric: '#e08a7c',
  highlight: '#4b4321',
}

export const useColors = (): Colors => (useColorScheme() === 'dark' ? dark : light)

/** Source Serif 4, loaded in src/app/_layout.tsx. */
export const serif = {
  regular: 'SourceSerif4_400Regular',
  italic: 'SourceSerif4_400Regular_Italic',
  semibold: 'SourceSerif4_600SemiBold',
  semiboldItalic: 'SourceSerif4_600SemiBold_Italic',
}

/** The text sizes in Settings, as a scale of the normal size. */
export const TEXT_SIZES = [
  { label: 'Small', scale: 0.9 },
  { label: 'Normal', scale: 1 },
  { label: 'Large', scale: 1.15 },
  { label: 'Largest', scale: 1.32 },
]
