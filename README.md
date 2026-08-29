# kindergarten-classroom

A single-page supplemental learning app for kindergarten-age kids (built for a 5-year-old), optimized for touchscreens (tablet/phone).

Open `index.html` in a browser — no build step required.

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
- **Audio**: 🔊/🔇 toggle in the top bar to mute text-to-speech. By default it auto-picks the best available browser voice per language.
- **Voice quality tiers (⚙️ Voice Settings)** — each falls back to the next if it's unavailable, so the app always works:
  1. **Free AI Voice**: one tap to enable, no API key — uses [Puter.js](https://developer.puter.com/)'s free access to OpenAI's TTS. The first use may prompt a free Puter.com sign-in. **This needs the page to be hosted online (http/https), not opened as a local file** — cloud sign-in generally can't complete from a `file://` page, and the app will warn you if it detects that. If you're just opening `index.html` directly, host it instead (e.g. enable GitHub Pages for this repo) to use this tier, or use option 2 below.
  2. **Your own Gemini key** (advanced/optional): paste a free [Google AI Studio](https://aistudio.google.com/apikey) API key for an alternative natural voice, with a "Test Voice" button that confirms it works before saving. Works fine from a local file.
  3. **Browser voice** (always available, zero setup): the best built-in voice the browser offers per language. Works fine from a local file.

  Any key you add is saved only in `localStorage` (never committed to this repo), and generated clips are cached in IndexedDB per phrase so repeat taps don't re-generate (or re-pay for) the same audio. If enabling the Free AI Voice ever leaves the screen looking stuck, just reload the page.
