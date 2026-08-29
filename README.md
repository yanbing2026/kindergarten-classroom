# Minecraft Classroom

A single-page supplemental learning app for kindergarten-age kids (built for a 5-year-old), optimized for touchscreens (tablet/phone). Themed around a Minecraft block/mob catalog to make letters, numbers, words, and beginner Chinese & Spanish feel like play.

Open `index.html` in a browser — no build step required. For the installable/offline features below, the site needs to be hosted (e.g. GitHub Pages) rather than opened as a local file — browsers require a real `http(s)` origin for service workers and "Add to Home Screen."

## Features

- **Levels**: Letters and Numbers open directly (no levels). English, Chinese, Spanish, and Math use a 10-level picker (Level 1–10). Difficulty and vocabulary ramp by level: English/Chinese/Spanish levels are grouped by word length (3–4 letters up to 12–15 letters), and Math difficulty scales as your child improves. Progress and mastery are tracked separately per level.
- **Shared vocabulary (one source of truth)** — English, Chinese (hanzi), and Spanish all come from a single `VOCAB_LEVELS` array in `index.html`. Add one word there and it appears in all three languages automatically, with its Minecraft sprite image.
- **Learn mode** for Letters, Numbers, English, Chinese, and Spanish — tap a card to hear it read aloud (uses the browser's built-in text-to-speech):
  - Letters: letter shown, then "X is for Apple" with the picture word.
  - Numbers: spoken number.
  - English: spelled letter-by-letter, then the word.
  - Chinese / Spanish: spoken in the foreign language, then the English translation.
- **Play mode** — quiz games with big tap-friendly multiple-choice buttons, spoken prompts, and encouraging feedback:
  - Letters: find-the-letter + "which letter does this start with?" (phonics).
  - Numbers: find-the-number + count-the-blocks.
  - English: match the word to its picture, or "sound it out" (spell it letter-by-letter).
  - Chinese: match the hanzi to its picture/English, or listen and pick the picture.
  - Spanish: match the word to its picture/English, or listen and pick the picture.
- **Write mode (✏️)** for Letters, Numbers, English, Chinese, and Spanish: trace the current letter/number/word/character with a finger or mouse over a large "ghost" outline on a canvas, with 🔊 replay-audio and 🧹 clear buttons. The ghost text auto-scales to fit the canvas. Earns a diamond per item traced, 8 items per round.
- **Math**: addition with visual 🍎 object groups in early levels; subtraction (take-away model) mixed in from Level 5. Difficulty ramps with the number of problems solved.
- **Progress tracking**: stars (💎), per-category mastery bars (combined across all levels), and unlockable trophies at 10 / 25 / 50 / 100 / 200 diamonds — all saved locally in the browser (`localStorage`), no account needed. Older save formats are migrated automatically.
- **Audio**: 🔊/🔇 toggle in the top bar to mute text-to-speech. Automatically picks the best available browser/system voice per language (preferring neural/premium voices when present) — no API key, no setup, works fully offline.
- **Installable app (PWA)**: has a web app manifest and a service worker, so once hosted it can be added to a phone/tablet home screen (Android Chrome: menu → "Add to Home screen"; iOS Safari: share → "Add to Home Screen") and opens full-screen like a native app. After the first visit, the app shell is cached and the whole game works fully offline.

## Notes

- Vocabulary images live in `images/words/` (Minecraft-style sprites, one per vocab entry).
- A native Android build (using the device's own TextToSpeech engine directly, for the best possible voice quality) is being explored separately.
