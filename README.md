# kindergarten-classroom

A single-page supplemental learning app for kindergarten-age kids (built for a 5-year-old), optimized for touchscreens (tablet/phone).

Open `index.html` in a browser — no build step required. For the installable/offline features below, the site needs to be hosted (e.g. GitHub Pages) rather than opened as a local file — browsers require a real `http(s)` origin for service workers and "Add to Home Screen."

## Features

- **Grade levels**: every category offers Kindergarten and 1st Grade content — tap a category, then pick a level. Progress and mastery are tracked separately per level.
- **Learn mode** for Letters, Numbers, Words, Chinese, Spanish, Colors, Shapes, and Animals — tap a card to hear it read aloud (uses the browser's built-in text-to-speech).
- **Play mode** — quiz games with big tap-friendly multiple-choice buttons, spoken prompts, and encouraging feedback:
  - Letters: single-letter recognition + phonics at Kindergarten; consonant blends/digraphs (sh, ch, th, bl, gr...) at 1st Grade
  - Numbers: 1-20 recognition + counting practice at Kindergarten; 2-digit number recognition (21-100) at 1st Grade
  - Words: CVC sight-word matching + "sound it out" phonics blending at Kindergarten; CVCe ("magic e") and blend words at 1st Grade
  - Chinese / Spanish: 20 beginner words each (greetings, family, numbers, colors) at Kindergarten; 20 more (numbers 4-10, more colors, school/social words) at 1st Grade — hanzi/pinyin or Spanish text with spoken audio, match word to picture or listen and pick the picture
  - Colors: 10 basic hues at Kindergarten; 10 more nuanced ones (turquoise, maroon, navy...) at 1st Grade
  - Shapes: basic 2D shapes at Kindergarten; pentagon/hexagon/octagon/trapezoid plus 3D solids at 1st Grade
  - Animals: 12 common animals at Kindergarten; 12 more at 1st Grade
- **Math**: addition with visual object groups at Kindergarten (difficulty ramps as your child improves); addition to 20 *and* subtraction (take-away model) at 1st Grade.
- **Progress tracking**: stars, per-category mastery bars (combined across both levels), and unlockable trophies — all saved locally in the browser (`localStorage`), no account needed.
- **Audio**: 🔊/🔇 toggle in the top bar to mute text-to-speech. Automatically picks the best available browser/system voice per language — no API key, no setup, works fully offline.
- **Installable app (PWA)**: has a web app manifest and a service worker, so once hosted it can be added to a phone/tablet home screen (Android Chrome: menu → "Add to Home screen"; iOS Safari: share → "Add to Home Screen") and opens full-screen like a native app. After the first visit, the app shell is cached and the whole game works fully offline.

A native Android build (using the device's own TextToSpeech engine directly, for the best possible voice quality) is being explored separately.
