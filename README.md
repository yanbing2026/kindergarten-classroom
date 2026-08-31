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
- **Math**: problems shown as clear symbolic equations (e.g. `6 × 3 = ?`, `12 ÷ 4 = ?`) and spoken aloud. Operations are introduced progressively by level — **addition** (Levels 1–4), then **subtraction** added (Levels 5–7), then **multiplication** (Levels 8–9), then **division** plus all four operations mixed (Level 10). Number sizes ramp up as your child solves more problems at each level.
- **Progress tracking**: stars (💎), per-category mastery bars (combined across all levels), and unlockable trophies at 10 / 25 / 50 / 100 / 200 diamonds — all saved locally in the browser (`localStorage`), no account needed. Older save formats are migrated automatically.
- **Audio**: 🔊/🔇 toggle in the top bar to mute text-to-speech. Automatically picks the best available browser/system voice per language (preferring neural/premium voices when present) — no API key, no setup, works fully offline.
- **Installable app (PWA)**: has a web app manifest and a service worker, so once hosted it can be added to a phone/tablet home screen (Android Chrome: menu → "Add to Home screen"; iOS Safari: share → "Add to Home Screen") and opens full-screen like a native app. After the first visit, the app shell is cached and the whole game works fully offline.

## Level Structure

English, Chinese, and Spanish vocabulary is organized into **10 levels** grouped by word length. New vocabulary should be appended to the appropriate existing level based on its English `id` length:

| Level | Word Length | Example Items |
|-------|-------------|---------------|
| 1 | 3–4 letters | axe, bat, bee, bow, cat, cod, cow, egg, fox, book |
| 2 | 4–5 letters | clay, coal, dirt, door, frog, goat, gold, iron, wolf, wool |
| 3 | 5 letters | arrow, blaze, boots, bread, camel, chest, clock, stick, paper, sugar, apple, wheat |
| 4 | 5–6 letters | sword, torch, water, witch, bamboo, barrel, beacon, bucket, carrot, cookie |
| 5 | 6 letters | hoglin, ladder, parrot, piglin, potato, rabbit, saddle, salmon, candle, cactus |
| 6 | 6–7 letters | zombie, axolotl, bedrock, chicken, compass, creeper, diamond, dolphin, emerald |
| 7 | 7–8 letters | strider, tadpole, trident, beetroot, campfire, crossbow, enderman, feather, mushroom |
| 8 | 8–10 letters | villager, armadillo, bookshelf, endermite, glowstone, polarbear, cavespider |
| 9 | 10–12 letters | netherrack, prismarine, pufferfish, silverfish, vindicator, cobblestone, goldenapple |
| 10 | 12–15 letters | tropicalfish, amethystshard, craftingtable, totemofundying, zombifiedpiglin |

**When adding new vocabulary:** append the entry to the level matching the English word's letter count. Never create a new level — max is 10.

## Data Sources

All vocabulary, images, and translations are sourced from the [Minecraft Wiki](https://minecraft.wiki/).

### Vocabulary & Images

The `VOCAB_LEVELS` array in `index.html` contains every word used across English, Chinese, and Spanish sections. Each entry includes:

- `id` — the English word (lowercase)
- `img` — path to the Minecraft sprite in `images/words/`
- `en` — English display name
- `zh.hanzi` — Chinese (Simplified) translation
- `es` — Spanish translation

Sprite images are item/mob PNGs from the Minecraft Wiki. When adding a new vocab entry, pull the corresponding sprite from `https://minecraft.wiki/images/` (search the item or mob page for the sprite file).

### Chinese Translations

Chinese translations use Simplified Chinese hanzi (简体中文). Sources for reference:

- [Minecraft Wiki — Chinese-language pages](https://minecraft.wiki/zh-hans/) (Simplified Chinese wiki)
- In-game item/mob names as they appear in Minecraft's Simplified Chinese localization

### Spanish Translations

Spanish translations use the localization names from Minecraft's Spanish language files. Sources for reference:

- [Minecraft Wiki — Spanish-language pages](https://minecraft.wiki/es/) (Spanish wiki)
- Minecraft's `es_es.lang` / `es_mx.lang` translation files for item and mob names

### Adding New Words

1. Find the item/mob on [minecraft.wiki](https://minecraft.wiki/) and download its sprite PNG.
2. Place the sprite in `images/words/` (lowercase filename, e.g. `diamond.png`).
3. Add one entry to `VOCAB_LEVELS` in `index.html` with `id`, `img`, `en`, `zh.hanzi`, and `es`.
4. The word automatically appears in English, Chinese, and Spanish sections.
