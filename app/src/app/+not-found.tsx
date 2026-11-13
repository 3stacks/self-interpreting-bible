import { Link, Stack } from 'expo-router'
import { P, Page } from '../components/Prose.tsx'
import { useColors } from '../lib/theme.ts'

export default function NotFound() {
  const c = useColors()
  return (
    <Page>
      <Stack.Screen options={{ title: 'Not found' }} />
      <P>The app has no page at this address.</P>
      <Link href="/" style={{ color: c.accent, fontSize: 17 }}>
        Go to the contents
      </Link>
    </Page>
  )
}
