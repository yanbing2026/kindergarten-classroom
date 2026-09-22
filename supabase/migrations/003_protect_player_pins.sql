-- Account PIN hardening for the existing players table.
-- Run in Supabase SQL Editor before deploying/testing the new client.
create extension if not exists pgcrypto;

alter table public.players
  add column if not exists pin_hash text,
  add column if not exists pin_salt text;

-- Existing plaintext PINs are migrated server-side, then removed.
-- This uses SHA-256(salt || PIN) for compatibility with Web Crypto.
do $$
declare
  r record;
  s text;
begin
  for r in select name, pin from public.players where pin is not null and pin_hash is null loop
    s := encode(gen_random_bytes(16), 'base64');
    update public.players
      set pin_salt = s,
          pin_hash = encode(digest(convert_to(s || pin, 'utf8'), 'sha256'), 'base64'),
          pin = null
      where name = r.name;
  end loop;
end $$;

alter table public.players alter column pin drop not null;
