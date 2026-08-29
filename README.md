# kindergarten-classroom

A single-page supplemental learning app for kindergarten-age kids (built for a 5-year-old), optimized for touchscreens (tablet/phone).

Open `index.html` in a browser — no build step required. For the installable/offline features below, the site needs to be hosted (e.g. GitHub Pages) rather than opened as a local file — browsers require a real `http(s)` origin for service workers and "Add to Home Screen."

## Features

- **Learn mode** for Letters, Numbers, Words, Chinese, Colors, Shapes, and Animals — tap a card to hear it read aloud (uses the browser's built-in text-to-speech).
- **Play mode** — quiz games with big tap-friendly multiple-choice buttons, spoken prompts, and encouraging feedback:
  - Letters: letter recognition + phonics ("which letter does this start with?")
  - Numbers: number recognition + counting practice
  - Words: sight-word matching + "sound it out" phonics blending
  - Chinese: 20 beginner Mandarin words (greetings, family, numbers, colors) with hanzi, pinyin, and spoken audio — match the character to a picture, or listen and pick the picture
  - Spanish: 20 beginner Spanish words covering the same everyday concepts, with spoken audio — match the word to a picture, or listen and pick the picture
  - Colors, Shapes, Animals: "find the ___" recognition games
- **Math**: simple addition practice with visual object groups, difficulty ramps up as your child improves.
- **Progress tracking**: stars, per-category mastery bars, and unlockable trophies — all saved locally in the browser (`localStorage`), no account needed.
- **Audio**: 🔊/🔇 toggle in the top bar to mute text-to-speech. Automatically picks the best available browser/system voice per language — no API key, no setup, works fully offline.
- **Installable app (PWA)**: has a web app manifest and a service worker, so once hosted it can be added to a phone/tablet home screen (Android Chrome: menu → "Add to Home screen"; iOS Safari: share → "Add to Home Screen") and opens full-screen like a native app. After the first visit, the app shell is cached and the whole game works fully offline.

A native Android build (using the device's own TextToSpeech engine directly, for the best possible voice quality) is being explored separately.
