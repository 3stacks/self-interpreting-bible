import {
  SourceSerif4_400Regular,
  SourceSerif4_400Regular_Italic,
  SourceSerif4_600SemiBold,
  SourceSerif4_600SemiBold_Italic,
  useFonts,
} from '@expo-google-fonts/source-serif-4'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { RefSheetProvider } from '../components/RefSheet.tsx'
import { PrefsProvider } from '../lib/prefs.tsx'
import { serif, useColors } from '../lib/theme.ts'

// Show the splash screen until the fonts load.
SplashScreen.preventAutoHideAsync().catch(() => {})

export default function Layout() {
  const c = useColors()
  const [loaded, failed] = useFonts({
    SourceSerif4_400Regular,
    SourceSerif4_400Regular_Italic,
    SourceSerif4_600SemiBold,
    SourceSerif4_600SemiBold_Italic,
  })
  useEffect(() => {
    if (loaded || failed) SplashScreen.hideAsync().catch(() => {})
  }, [loaded, failed])
  if (!loaded && !failed) return null

  return (
    <PrefsProvider>
      <RefSheetProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: c.bg },
            headerTintColor: c.accent,
            headerTitleStyle: { fontFamily: serif.semibold, color: c.ink },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: c.bg },
          }}>
          <Stack.Screen name="index" options={{ title: 'Contents' }} />
          <Stack.Screen name="book/[code]" options={{ title: '' }} />
          <Stack.Screen name="read/[code]/[chapter]" options={{ title: '' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="about" options={{ title: 'About' }} />
          <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
        </Stack>
      </RefSheetProvider>
    </PrefsProvider>
  )
}
