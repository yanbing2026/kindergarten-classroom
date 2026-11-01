-- Account security hardening (009).
-- Run after 008_harden_claim_player_auth_throttling.sql.
--
-- Goals:
--   1. Account enumeration: get_player_salt no longer reveals whether a name
--      exists, and is throttled like login.
--   2. Credential disclosure: login_player / create_player never return the
--      PIN verifier (pin_hash) or salt. The verifier is a bearer credential
--      for save_player_progress and must stay in the browser's session only.
--   3. Abuse limits: create_player and salt lookups are throttled.
--   4. Recovery: rotate_pin, delete_player, and release_player_auth.
--
-- Return-type changes require DROP + CREATE in Postgres, not CREATE OR REPLACE.

-- ---------------------------------------------------------------------------
-- Salt lookup: constant response shape + throttling
-- ---------------------------------------------------------------------------
drop function if exists public.get_player_salt(text);

create or replace function public.get_player_salt(p_name text)
returns table(pin_salt text)
language plpgsql
security definer
set search_path = public
as $$
declare
  k text := 'salt:' || lower(trim(p_name));
  a public.player_login_attempts%rowtype;
  real_salt text;
  new_count integer;
begin
  select * into a from public.player_login_attempts where player_key = k;
  if a.locked_until is not null and a.locked_until > now() then
    -- Same error as an existing account would produce from the client's
    -- point of view: "account not found" is decided by login, not here.
    raise exception 'too many attempts, account temporarily locked';
  end if;

  select p.pin_salt into real_salt
  from public.players p
  where lower(p.name) = lower(trim(p_name))
    and p.pin_hash is not null
  limit 1;

  -- Always return exactly one row with a base64-looking salt. A missing
  -- account gets a random, unusable value so response shape and length do
  -- not reveal whether the name exists.
  if real_salt is null then
    real_salt := encode(convert_to(md5(random()::text || clock_timestamp()::text), 'utf8'), 'base64');
  end if;

  -- Count lookups, resetting the window after five minutes.
  new_count := case
    when a.last_attempt_at is not null and a.last_attempt_at < now() - interval '5 minutes' then 1
    else coalesce(a.failed_count, 0) + 1
  end;

  insert into public.player_login_attempts(player_key, failed_count, locked_until, last_attempt_at)
  values (k, 1, null, now())
  on conflict (player_key) do update
    set failed_count = new_count,
        locked_until = case when new_count >= 20 then now() + interval '60 seconds' else null end,
        last_attempt_at = now();

  return query select real_salt;
end;
$$;

revoke all on function public.get_player_salt(text) from public;
grant execute on function public.get_player_salt(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Login: return name + progress only (no pin_hash / pin_salt)
-- ---------------------------------------------------------------------------
drop function if exists public.login_player(text, text);

create or replace function public.login_player(
  p_name text,
  p_pin_hash text
)
returns table(name text, progress jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  k text := lower(trim(p_name));
  a public.player_login_attempts%rowtype;
  p public.players%rowtype;
  new_count integer;
begin
  select * into a from public.player_login_attempts where player_key = k;
  if a.locked_until is not null and a.locked_until > now() then
    return;
  end if;

  select * into p from public.players
  where lower(name) = k
    and pin_hash = p_pin_hash
  limit 1;

  if p.name is not null then
    delete from public.player_login_attempts where player_key = k;
    return query select p.name, p.progress;
    return;
  end if;

  new_count := case
    when a.last_attempt_at is not null and a.last_attempt_at < now() - interval '5 minutes' then 1
    else coalesce(a.failed_count, 0) + 1
  end;

  insert into public.player_login_attempts(player_key, failed_count, locked_until, last_attempt_at)
  values (k, 1, null, now())
  on conflict (player_key) do update
    set failed_count = new_count,
        locked_until = case when new_count >= 5 then now() + interval '30 seconds' else null end,
        last_attempt_at = now();

  return;
end;
$$;

revoke all on function public.login_player(text, text) from public;
grant execute on function public.login_player(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Create: name/pin validation, throttling, no credential in the response
-- ---------------------------------------------------------------------------
drop function if exists public.create_player(text, text, text, jsonb);

create or replace function public.create_player(
  p_name text,
  p_pin_hash text,
  p_pin_salt text,
  p_progress jsonb default '{}'::jsonb
)
returns table(name text, progress jsonb)
language plpgsql
security definer
set search_path = public
as $$
declare
  k text := 'create:' || lower(trim(p_name));
  a public.player_login_attempts%rowtype;
  new_count integer;
begin
  if p_name is null or p_name !~ '^[A-Za-z0-9 _-]{2,24}$' then
    raise exception 'invalid player name';
  end if;
  if p_pin_hash is null or length(p_pin_hash) < 32 then
    raise exception 'invalid pin verifier';
  end if;
  if p_pin_salt is null or length(p_pin_salt) < 12 then
    raise exception 'invalid pin salt';
  end if;

  select * into a from public.player_login_attempts where player_key = k;
  if a.locked_until is not null and a.locked_until > now() then
    raise exception 'too many accounts created, try again later';
  end if;

  new_count := case
    when a.last_attempt_at is not null and a.last_attempt_at < now() - interval '5 minutes' then 1
    else coalesce(a.failed_count, 0) + 1
  end;

  insert into public.player_login_attempts(player_key, failed_count, locked_until, last_attempt_at)
  values (k, 1, null, now())
  on conflict (player_key) do update
    set failed_count = new_count,
        locked_until = case when new_count >= 5 then now() + interval '60 seconds' else null end,
        last_attempt_at = now();

  if new_count >= 5 then
    raise exception 'too many accounts created, try again later';
  end if;

  insert into public.players(name, pin_hash, pin_salt, progress, pin)
  values (trim(p_name), p_pin_hash, p_pin_salt, coalesce(p_progress, '{}'::jsonb), null);

  return query
    select p.name, p.progress
    from public.players p
    where lower(p.name) = lower(trim(p_name))
    limit 1;
end;
$$;

revoke all on function public.create_player(text, text, text, jsonb) from public;
grant execute on function public.create_player(text, text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Progress save keeps the verifier check; strip the legacy pin fallback.
-- ---------------------------------------------------------------------------
create or replace function public.save_player_progress(
  p_name text,
  p_pin_hash text,
  p_progress jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.players
     set progress = coalesce(p_progress, '{}'::jsonb),
         last_seen_at = now()
   where lower(name) = lower(trim(p_name))
     and pin_hash = p_pin_hash;
  return found;
end;
$$;

revoke all on function public.save_player_progress(text, text, jsonb) from public;
grant execute on function public.save_player_progress(text, text, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Release the current browser's ownership link (logout / shared tablet).
-- ---------------------------------------------------------------------------
create or replace function public.release_player_auth(
  p_name text,
  p_pin_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  changed integer;
begin
  if uid is null then
    return false;
  end if;

  update public.players
     set auth_user_id = null
   where lower(name) = lower(trim(p_name))
     and pin_hash = p_pin_hash
     and auth_user_id = uid;
  get diagnostics changed = row_count;
  return changed > 0;
end;
$$;

revoke all on function public.release_player_auth(text, text) from public;
grant execute on function public.release_player_auth(text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Change PIN with the old verifier.
-- ---------------------------------------------------------------------------
create or replace function public.rotate_pin(
  p_name text,
  p_old_pin_hash text,
  p_new_pin_hash text,
  p_new_pin_salt text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  changed integer;
begin
  if p_new_pin_hash is null or length(p_new_pin_hash) < 32 then
    raise exception 'invalid pin verifier';
  end if;
  if p_new_pin_salt is null or length(p_new_pin_salt) < 12 then
    raise exception 'invalid pin salt';
  end if;

  update public.players
     set pin_hash = p_new_pin_hash,
         pin_salt = p_new_pin_salt,
         pin = null
   where lower(name) = lower(trim(p_name))
     and pin_hash = p_old_pin_hash;
  get diagnostics changed = row_count;

  -- A changed credential invalidates any browser ownership link.
  if changed > 0 then
    update public.players
       set auth_user_id = null
     where lower(name) = lower(trim(p_name));
  end if;

  return changed > 0;
end;
$$;

revoke all on function public.rotate_pin(text, text, text, text) from public;
grant execute on function public.rotate_pin(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Delete an account with its PIN. Normalized tables cascade via player_id FKs;
-- if a deployment lacks those FKs, delete the child rows explicitly first.
-- ---------------------------------------------------------------------------
create or replace function public.delete_player(
  p_name text,
  p_pin_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
begin
  select p.id into target
  from public.players p
  where lower(p.name) = lower(trim(p_name))
    and p.pin_hash = p_pin_hash
  limit 1;

  if target is null then
    return false;
  end if;

  delete from public.activity_events where player_id = target;
  delete from public.player_progress where player_id = target;
  delete from public.daily_goals where player_id = target;
  delete from public.players where id = target;
  return true;
end;
$$;

revoke all on function public.delete_player(text, text) from public;
grant execute on function public.delete_player(text, text) to anon, authenticated;

-- Documentation of expected client contract:
--   cloudLogin() reads   data[0].name / data[0].progress
--   cloudCreate() reads  data[0].name / data[0].progress
--   pin_hash is never returned; the browser keeps the verifier it computed
--   in sessionStorage for save/rotate/delete calls.
