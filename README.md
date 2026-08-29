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
- **Voice quality tiers (⚙️ Voice Settings)**:
  1. **Your own Gemini key** (optional): paste a free [Google AI Studio](https://aistudio.google.com/apikey) API key for a more natural voice, with a "Test Voice" button that confirms it works before saving. Works fine from a local file — it's a plain API call, no sign-in flow.
  2. **Browser voice** (always available, zero setup): the best built-in voice the browser offers per language, auto-selected.

  A saved key lives only in `localStorage` (never committed to this repo), and generated clips are cached in IndexedDB per phrase so repeat taps don't re-generate (or re-pay for) the same audio. Without a key, or if a request ever fails, the app silently falls back to the browser voice.
