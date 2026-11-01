-- Harden claim_player_auth and login_player against brute-force attacks.
-- Run after 007_tighten_normalized_rpc_exposure.sql.

-- 1. Add last_attempt_at to track inactivity window
alter table public.player_login_attempts
  add column if not exists last_attempt_at timestamptz default now();

-- 2. Update login_player to reset failed_count after 5 minutes of inactivity
create or replace function public.login_player(
  p_name text,
  p_pin_hash text
)
returns table(name text, pin_hash text, pin_salt text, progress jsonb)
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
  select * into a from public.player_login_attempts where player_key=k;
  if a.locked_until is not null and a.locked_until > now() then
    return;
  end if;

  select * into p from public.players
    where lower(name)=k
      and pin_hash=p_pin_hash
    limit 1;

  if p.name is not null then
    delete from public.player_login_attempts where player_key=k;
    return query select p.name,p.pin_hash,p.pin_salt,p.progress;
    return;
  end if;

  -- Reset failed count if last attempt was more than 5 minutes ago
  new_count := case
    when a.last_attempt_at is not null and a.last_attempt_at < now() - interval '5 minutes' then 1
    else coalesce(a.failed_count, 0) + 1
  end;

  insert into public.player_login_attempts(player_key, failed_count, locked_until, last_attempt_at)
  values(k, 1, null, now())
  on conflict(player_key) do update
    set failed_count = new_count,
        locked_until = case
          when new_count >= 5 then now() + interval '30 seconds'
          else null
        end,
        last_attempt_at = now();

  return;
end;
$$;

revoke all on function public.login_player(text,text) from public;
grant execute on function public.login_player(text,text) to anon, authenticated;

-- 3. Harden claim_player_auth with identical throttling checks
create or replace function public.claim_player_auth(
  p_name text,
  p_pin_hash text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  k text := lower(trim(p_name));
  a public.player_login_attempts%rowtype;
  target public.players%rowtype;
  owned_count integer;
  new_count integer;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  -- Check lockout before credential verification
  select * into a from public.player_login_attempts where player_key=k;
  if a.locked_until is not null and a.locked_until > now() then
    raise exception 'too many attempts, account temporarily locked';
  end if;

  select * into target
  from public.players
  where lower(trim(name)) = k
    and pin_hash = p_pin_hash
  limit 1;

  if target.id is null then
    -- Record failed attempt and lock if threshold exceeded
    new_count := case
      when a.last_attempt_at is not null and a.last_attempt_at < now() - interval '5 minutes' then 1
      else coalesce(a.failed_count, 0) + 1
    end;

    insert into public.player_login_attempts(player_key, failed_count, locked_until, last_attempt_at)
    values(k, 1, null, now())
    on conflict(player_key) do update
      set failed_count = new_count,
          locked_until = case
            when new_count >= 5 then now() + interval '30 seconds'
            else null
          end,
          last_attempt_at = now();

    raise exception 'invalid account credentials';
  end if;

  -- Clear failed login attempts upon successful credential verification
  delete from public.player_login_attempts where player_key=k;

  select count(*) into owned_count
  from public.players
  where auth_user_id = uid
    and id <> target.id;

  if owned_count > 0 then
    raise exception 'auth session already linked to another player';
  end if;

  if target.auth_user_id is not null and target.auth_user_id <> uid then
    raise exception 'player account is already linked';
  end if;

  update public.players
     set auth_user_id = uid,
         last_seen_at = now()
   where id = target.id;

  return target.id;
end;
$$;

revoke all on function public.claim_player_auth(text,text) from public;
grant execute on function public.claim_player_auth(text,text) to authenticated;
