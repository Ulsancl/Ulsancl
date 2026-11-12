# MARKET DESK Android / Play release

Developer: **standard__bae**. Package: `io.github.ulsancl.marketdesk`. Version: 2.0.1 / 20001.

The web practice release and Android review artifacts are separate from a Google Play publication. There is currently no Play developer account, support email, Firebase project or production app-signing certificate supplied by the owner. Do not label an unsigned AAB, debug APK, successful CI run, web deployment, or internal test as a published Play release.

## Build

Use JDK 21 (a JDK with `javac`, not a JRE), Android SDK platform 36/build-tools 36.0.0 and the committed Gradle 8.13 wrapper with distribution checksum. The Android project uses Android Browser Helper 2.7.4, targets Android 16/API 36, supports Android 7/API 24+, and contains no native `.so` libraries. It uses Internet access and an AndroidX-generated app-private signature permission; there are no advertising, billing, notification, camera or location permissions.

```sh
npm ci
npm run build
npm run check:play
android/gradlew -p android assembleDebug lintDebug bundleRelease -PmarketdeskUnsignedPreview
```

`app-debug.apk` is an installable development build. `app-release.aab` produced with `marketdeskUnsignedPreview` has **no release signature and cannot be uploaded to Play**. The CI artifact calls it `market-desk-UNSIGNED-preview.aab` explicitly. Normal `bundleRelease` fails without the four signing inputs: `MARKETDESK_KEYSTORE` (absolute path), `MARKETDESK_STORE_PASSWORD`, `MARKETDESK_KEY_ALIAS`, `MARKETDESK_KEY_PASSWORD`. Supply these through a secret store, never Git, Vite variables, chat, command-line passwords or store metadata. Back up the upload key securely under the developer's control before first submission.

## Android behavior

The app launches the same HTTPS game in a Trusted Web Activity. It shares browser authentication and storage, so Google login does not run in an embedded WebView. Supported same-origin links open the game or privacy/deletion/help pages; unrelated incoming URLs are replaced with the game URL. Browser/system Back returns through workspace history. Wide layouts support tablets and landscape; no orientation lock is imposed.

Before Digital Asset Links are configured, development installs fall back to a Custom Tab with its browser toolbar. This is deliberate: **there is no fullscreen verification bypass**. First loading the game and downloading updates require Internet. The service worker supports offline practice after a successful initial load while its cache remains available. Uninstalling the wrapper does not necessarily remove browser storage; the in-app and web deletion controls explain and remove that data.

## Submission sequence

1. The owner creates a [Google Play developer account](https://play.google.com/console/signup), completes Google's identity/contact verification and provides a real support email. Do not fabricate a developer identity, phone, address, email or payment details. Set the public developer name to `standard__bae`.
2. Create the application in Play Console with the package above. Complete app access, content rating, target audience, ads, financial-features and Data safety forms against the actual shipped practice build. The category proposal is game/simulation; do not predeclare an IARC rating. There are no deposits, real asset purchases, cash prizes, ads or in-app purchases. Copy the checked Korean text from `LISTING.ko-KR.md` and use the actual graphics/screenshots.
3. Enroll in Play App Signing, retain the upload key, and obtain the **app-signing** SHA-256 certificate from Play Console (not merely the upload/debug certificate). Add it to `release/play.json` and `public/.well-known/assetlinks.json` using `delegate_permission/common.handle_all_urls`, namespace `android_app`, and the exact package ID. Keep fingerprints uppercase and colon-separated. Publish that file at the HTTPS origin root, without login or redirects. Do not register debug signing keys against the production origin.
4. Set `supportEmail` and `playConsoleRegistered` truthfully. Run `npm run check:play:production`, build the signed AAB without the unsigned-preview flag, verify its signing certificate, upload to internal testing, and use the Play-generated install link to test actual TWA verification, login, deletion, offline restart and Android Back.
5. If the account is a new personal developer account subject to Google's testing requirement, run a closed test with **at least 12 opted-in testers for 14 continuous days**, gather actual feedback, and apply for production access. Do not invent testers, dates, feedback, approvals or test results. Then submit the release for review and confirm the real store listing is published before declaring the goal complete.

Sources checked 2026-11-12: [target API requirement](https://developer.android.com/google/play/requirements/target-sdk), [account deletion](https://support.google.com/googleplay/android-developer/answer/13327111), [new personal-account testing](https://support.google.com/googleplay/android-developer/answer/14151465), [TWA architecture](https://developer.android.com/develop/ui/views/layout/webapps/trusted-web-activities).

## Data safety and service activation

The initial web/app release is **practice only**. It does not initialize Firebase or send practice orders to a game server. Browser local storage contains the practice save; no analytics/ads SDK is present. Hosting/network providers can process connection logs. Review the hosting/browser handling when completing Data safety; do not claim zero network data processing just because gameplay storage is local.

If Firebase is enabled later, update the store disclosure before release: authentication identifiers/email, optional nickname/country/region/age band, in-game activity and reports are processed by the game and Google Firebase. Ranking publication is optional. Complete the deployment and smoke checks in `../desk/OPERATIONS.md`, including App Check and the privacy scheduler. Public service starts with a 100-person season capacity. Support-contact details and backup/retention policy must reflect the real deployment.

## Evidence and promotion

Android CI publishes only review artifacts. A production check fails while owner/account/contact/signing inputs are missing. `public/.well-known/assetlinks.json` starts as an empty array because no signing certificate is known. The release checker validates package/version/target SDK, icon dimensions, store text lengths and domain consistency. A successful check of source files alone does not establish store readiness.

Keep emulator and device testing evidence separate from browser screenshots. The graphics and phone-sized browser captures are preparation assets; replace/confirm screenshots against the final Play-installed build when its verified fullscreen mode is available.
