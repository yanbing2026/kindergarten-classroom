# Supabase architecture

The classroom uses Supabase as the cloud data layer while GitHub Pages remains the static web host.

## Responsibilities

- **GitHub Pages:** UI, lesson rendering, interactive question engine, Blipola client runtime.
- **Supabase:** student account data, curriculum metadata, normalized progress, activity events, daily goals.
- **localStorage:** offline-first cache and compatibility with the existing classroom app.
- **RPC account layer:** current name + PIN account flow. PINs are never stored as plaintext by the browser.

## Data flow

`UI -> local progress -> cloud sync -> Supabase`

Learning should continue when offline. Cloud synchronization is asynchronous and should never block a lesson.

## Core tables

- `players`
- `curriculum_units`
- `player_progress`
- `activity_events`
- `daily_goals`

## Security

RLS is enabled on user-data tables. Ownership is linked through `players.auth_user_id`.

The browser must never contain a service-role key. The current frontend uses a Supabase publishable key.

See `supabase/schema.sql` for the canonical structural reference.
