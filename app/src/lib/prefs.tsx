import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

// The settings and the last chapter stay on the device, in AsyncStorage.

export interface Prefs {
  /** An index into TEXT_SIZES. */
  textSize: number
  /** Show the modern equivalents of biblical measures. */
  measures: boolean
  /** Show the margin references under each verse. */
  margin: boolean
  /** The last chapter that the reader opened: "Gen/3". */
  last: string | null
}

export const DEFAULT_PREFS: Prefs = { textSize: 1, measures: true, margin: true, last: null }
const KEY = 'haddington:prefs'

function parse(raw: string | null): Prefs {
  try {
    const p = raw ? JSON.parse(raw) : {}
    return {
      textSize: Number.isInteger(p.textSize) && p.textSize >= 0 && p.textSize <= 3 ? p.textSize : DEFAULT_PREFS.textSize,
      measures: typeof p.measures === 'boolean' ? p.measures : DEFAULT_PREFS.measures,
      margin: typeof p.margin === 'boolean' ? p.margin : DEFAULT_PREFS.margin,
      last: typeof p.last === 'string' ? p.last : null,
    }
  } catch {
    return DEFAULT_PREFS
  }
}

type PrefsValue = [Prefs, (change: Partial<Prefs>) => void]
const LoadedContext = createContext(false)
const PrefsContext = createContext<PrefsValue>([DEFAULT_PREFS, () => {}])

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    AsyncStorage.getItem(KEY).then(
      (raw) => {
        setPrefs(parse(raw))
        setLoaded(true)
      },
      () => setLoaded(true),
    )
  }, [])
  const update = useCallback((change: Partial<Prefs>) => {
    setPrefs((old) => {
      const next = { ...old, ...change }
      AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {
        // Storage failed. The setting lasts until the app closes.
      })
      return next
    })
  }, [])
  return (
    <LoadedContext.Provider value={loaded}>
      <PrefsContext.Provider value={[prefs, update]}>{children}</PrefsContext.Provider>
    </LoadedContext.Provider>
  )
}

export const usePrefs = () => useContext(PrefsContext)
export const usePrefsLoaded = () => useContext(LoadedContext)
