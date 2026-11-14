import * as WebBrowser from 'expo-web-browser'
import { Alert, Linking, Platform } from 'react-native'
import { APPS, appLink, siblingOf } from './appLink.ts'

/** Open `url` in the in-app browser. */
async function browse(url: string) {
  await WebBrowser.openBrowserAsync(url).catch(() => {
    // The browser did not open. There is nothing more to do.
  })
}

/**
 * Open a link to another app of the suite, or to a source. A link to Hearers,
 * Precentor, Covenant Household or A Method for Prayer opens that app when it
 * is on the device. On an iPhone, a link to a sibling app that is not installed
 * asks to get the app from the App Store or to open the website. Any other link
 * opens in the in-app browser.
 */
export function open(url: string) {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener')
    return
  }
  void (async () => {
    const app = appLink(url, 'haddingtonbible')
    if (app) {
      try {
        await Linking.openURL(app)
        return
      } catch {
        // The app is not on the device.
      }
      const sibling = APPS[siblingOf(url, 'haddingtonbible') ?? '']
      const store = sibling?.appStore
      if (Platform.OS === 'ios' && sibling && store) {
        const { name } = sibling
        Alert.alert(`${name} is not on this iPhone`, `Get ${name} free from the App Store, or open the website.`, [
          { text: 'App Store', onPress: () => void Linking.openURL(store).catch(() => browse(url)) },
          { text: 'Website', onPress: () => void browse(url) },
          { text: 'Cancel', style: 'cancel' },
        ])
        return
      }
    }
    await browse(url)
  })()
}
