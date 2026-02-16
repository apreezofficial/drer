# DRER desktop

A desktop assistant with real macOS actions. Close the window to keep DRER in the menu bar; use **⌘⇧Space** to reopen it. Quit from the tray menu. Native Apple Reminders and Calendar records remain saved after DRER quits.

## Run and install

```sh
npm ci
npm start
npm run pack:mac
```

The macOS build is `dist/mac-arm64/DRER.app`. Copy it to Applications. This local build is not notarized for public distribution. Public releases still need signing and notarization.

## Try it

- `open Mail`, `open Spotify`, `open Google Chrome`: discovers installed applications by name; reports missing or ambiguous matches.
- `play Spotify music for me`, `pause music`, `next track`: controls Spotify's current queue. Spotify must be installed and signed in; selecting a particular song is not implemented.
- `remind me in 10 minutes to stretch`, `set a timer for 10s`, `set an alarm at 6:42pm`: creates a timed Apple Reminders alert on macOS. These are Reminders alerts, not Clock app alarms.
- `Schedule a meeting called Design review tomorrow at 10am for 30 minutes`: saves an event in the default Apple Calendar. Does not invite attendees.
- `Save a note called Ideas: My next project`: writes a real file in Documents/DRER.
- `search the web for local-first software`: opens the default browser's search page.
- `build a habit tracker`: writes a working local starter template, not a custom AI-built application.

## Permissions and AI

Each user grants their own macOS permissions when needed: Reminders, Calendar, Spotify Automation, and Screen Recording. Denied permissions produce errors; DRER does not bypass them. App launching alone does not require access to the contents of those apps. Universal app control, wake-word listening, microphone input, and autonomous browsing are not implemented.

For flexible natural-language requests, open **Settings**, paste your own Groq API key, and save. The key is encrypted using Electron safeStorage in your local DRER profile and decrypted only when an AI request needs it; macOS may show a Keychain prompt. It is never included in the application bundle. Common actions above work without a key. Screen context is sent to Groq only when explicitly selected; screen reading still requires a separate successful permission test.

macOS native actions have been tested locally. Windows/Linux launch targets exist, but equivalent system integrations are not yet implemented or verified.

## Verification

```sh
npm test
npm run test:desktop
# Test an installed build:
DRER_EXECUTABLE=/Applications/DRER.app/Contents/MacOS/DRER npm run test:desktop
```

The desktop integration test exercises the renderer preload/IPC request connection and uses a temporary profile and your locally encrypted configuration, creates actual named test reminders/events, opens Calculator and Mail, calls the live model, records the actual renderer, quits DRER, and verifies reminders from a separate native process. Outputs are in ignored `test-results/native-system`. This test changes native app data; it does not mock successful actions.
