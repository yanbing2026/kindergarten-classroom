-- Protect the players table: browser code must use narrow RPCs instead of table SELECT/UPDATE.
-- Run after 003_protect_player_pins.sql.
create or replace function public.get_player_salt(p_name text)
returns table(pin_salt text)
language sql
security definer
set search_path = public
as $$
  select p.pin_salt
  from public.players p
  where lower(p.name)=lower(p_name)
    and p.pin_hash is not null
  limit 1;
$$;

create or replace function public.create_player(
  p_name text,
  p_pin_hash text,
  p_pin_salt text,
  p_progress jsonb default '{}'::jsonb
)
returns table(name text, pin_hash text, pin_salt text, progress jsonb)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.players(name,pin_hash,pin_salt,progress,pin)
  values (p_name,p_pin_hash,p_pin_salt,coalesce(p_progress,'{}'::jsonb),null);
  return query
    select p.name,p.pin_hash,p.pin_salt,p.progress
    from public.players p where p.name=p_name;
end;
$$;

create or replace function public.login_player(
  p_name text,
  p_pin_hash text
)
returns table(name text, pin_hash text, pin_salt text, progress jsonb)
language sql
security definer
set search_path = public
as $$
  select p.name,p.pin_hash,p.pin_salt,p.progress
  from public.players p
  where lower(p.name)=lower(p_name)
    and p.pin_hash=p_pin_hash
  limit 1;
$$;

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
     set progress=coalesce(p_progress,'{}'::jsonb)
   where lower(name)=lower(p_name)
     and pin_hash=p_pin_hash;
  return found;
end;
$$;

-- Remove direct anonymous/authenticated table access. The app can only use the RPCs above.
alter table public.players enable row level security;
drop policy if exists "players_public_select" on public.players;
drop policy if exists "players_public_insert" on public.players;
drop policy if exists "players_public_update" on public.players;
drop policy if exists "players_anon_select" on public.players;
drop policy if exists "players_anon_insert" on public.players;
drop policy if exists "players_anon_update" on public.players;
drop policy if exists "players_authenticated_select" on public.players;
drop policy if exists "players_authenticated_insert" on public.players;
drop policy if exists "players_authenticated_update" on public.players;

revoke all on table public.players from anon, authenticated;
grant execute on function public.get_player_salt(text) to anon, authenticated;
grant execute on function public.create_player(text,text,text,jsonb) to anon, authenticated;
grant execute on function public.login_player(text,text) to anon, authenticated;
grant execute on function public.save_player_progress(text,text,jsonb) to anon, authenticated;
