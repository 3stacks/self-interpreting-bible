# Haddington Bible for iOS and Android

The mobile app of the Self-Interpreting Bible. It uses Expo (SDK 58), React Native and Expo Router.
It shows the same verses, margin references and notes as the website.

The app has all the text in its bundle, so it works with no connection. The links to Hearers,
Precentor and the website open in the in-app browser. The app has no analytics.

## Run

The app needs Node 24. Run these commands in `app/`:

```bash
npm ci
npm run data      # install the packages at the root, then write data/
npx expo start
```

Scan the QR code with Expo Go on a phone. Or press `i` for the iOS Simulator, or `a` for the
Android emulator.

Run these checks before a release:

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
npx expo export --platform ios --platform android   # the bundles must compile
```

## Screens

| Path | Screen |
| --- | --- |
| `/` | The contents |
| `/book/Ps` | A book: the introduction and the chapters |
| `/read/Ps/23` | A chapter. `?v=4` opens it at verse 4. |
| `/settings`, `/about`, `/privacy` | The text pages |

The deep link `haddingtonbible://read/Ps/23` opens a chapter.

## The data

`tools/app-data.mjs` writes `data/`. It uses the `lib/` modules of the website. It writes these
files:

- `data/index.json`: the books, and the chapters that have Brown's text and notes
- `data/ch/<book>/<chapter>.json`: one file for each chapter
- `data/kjv/<book>.json`: the KJV text, for the reference sheet
- `data/files.ts`: a `require` for each file, so Metro puts the files in the bundle

A chapter that is not in the transcription comes from the KJV. The app says so on the page.

## Build for the stores

Read `store/RELEASE.md` at the root of the repository. The app id is
`com.lukeboyle.haddingtonbible` on both stores. You cannot change it after the first upload.
