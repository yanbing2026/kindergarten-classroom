-- Account PIN hardening for the existing players table.
-- Run this once in the Supabase SQL Editor before using the protected PIN client.
alter table public.players
  add column if not exists pin_hash text,
  add column if not exists pin_salt text;

-- Keep the legacy pin column temporarily so existing accounts can log in once.
-- The client replaces it with a salted PBKDF2 verifier after successful login.
alter table public.players alter column pin drop not null;

-- New accounts use pin_hash/pin_salt and leave pin NULL.
