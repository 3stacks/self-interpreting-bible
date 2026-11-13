# Release Haddington Bible to the App Store and Google Play

Do these steps on your Mac. You need Xcode, Node 24, an Expo account, the Apple Developer account and
the Google Play developer account. `store/listing.md` has the text of each store field.

## Once for each app

1. Get the code and install it. The `scans/` folder is large, so the clone leaves it out. The app
   does not need it. `npm run data` installs the packages at the root and writes `app/data/`.

   ```bash
   git clone --filter=blob:none --no-checkout https://github.com/3stacks/self-interpreting-bible.git
   cd self-interpreting-bible
   git sparse-checkout set --no-cone '/*' '!/scans/'
   git checkout app/expo
   cd app && npm ci && npm run data
   ```

2. Log in to Expo. Do this once on the Mac:

   ```bash
   npx eas-cli@latest login
   ```

3. Link the app to an EAS project. The command adds `extra.eas.projectId` and `owner` to `app.json`.
   Commit that change.

   ```bash
   npx eas-cli@latest init
   ```

## iOS

4. Build the app. At the first build, EAS asks for your Apple ID. Let EAS make the distribution
   certificate and the provisioning profile, and register the bundle ID.

   ```bash
   npx eas-cli@latest build -p ios --profile production
   ```

5. Send the build to App Store Connect. If the app has no record yet, EAS makes one. Give the name
   "Haddington Bible", the SKU `haddingtonbible`, and the primary language "English (Australia)".

   ```bash
   npx eas-cli@latest submit -p ios --latest
   ```

6. Wait for Apple to process the build. This takes 5 to 30 minutes. Then install it from TestFlight
   on your iPhone and test it.

7. In App Store Connect, complete the version page:
   - Copy each field from `store/listing.md`.
   - Add the screenshots (see "Screenshots" below).
   - Complete "App Privacy": select "Data Not Collected".
   - Complete the age rating questionnaire. Answer "None" to each question.
   - Select the build. Then click "Add for Review", and "Submit for Review".

## Android

8. Build the app bundle:

   ```bash
   npx eas-cli@latest build -p android --profile production
   ```

9. In the Google Play Console, make the app: name "Haddington Bible", app, free. Then complete each item of
   "Set up your app". `store/listing.md` gives each answer. The graphics are in `store/`.

10. Upload the first bundle by hand: Testing > Internal testing > Create new release. Download the
    `.aab` file from the EAS build page. Google Play accepts uploads through the API only after this
    first upload by hand.

11. For later releases, make a service account with access to the Play Console. Save its key as
    `google-service-account.json`, and do not commit it. Then run:

    ```bash
    npx eas-cli@latest submit -p android --latest
    ```

12. Production release waits for the change of the developer account to an organisation account.

## Screenshots

The screenshots are in `store/screenshots/`. Upload `ios/` to App Store Connect and `play/` to
Google Play, in the order of the file names. If App Store Connect asks for the 6.3-inch display, use
`ios-6.3/`. `store/screenshots/README.md` tells how to make them again.

## The app data

The text of the app is in `app/data/`. Git does not keep that folder. `tools/app-data.mjs` writes it
from `transcription/` and `data/kjv-src.json`. On EAS Build, the `eas-build-post-install` script
runs `npm run data`, so each build has the transcription of its commit. To put new transcription in
the app, make a new build.

`.easignore` at the root of the repository keeps `scans/` and `site/` out of the upload to EAS
Build.

## Each later release

```bash
npx eas-cli@latest build --profile production --auto-submit
```

EAS increases the build number of each build. Change `version` in `app.json` for each new release
to the stores.
