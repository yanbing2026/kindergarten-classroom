-- Normalized learning-data ownership hardening.
-- Every normalized row is owned by the player linked to the current
-- Supabase Auth user. The browser-supplied player_id is never trusted
-- for authorization; RLS derives ownership from auth.uid().

create or replace function public.current_player_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.players p
  where p.auth_user_id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_player_id() from public;
grant execute on function public.current_player_id() to anon, authenticated;

create unique index if not exists players_auth_user_id_unique
  on public.players(auth_user_id)
  where auth_user_id is not null;

-- Bind a name+PIN login to the current anonymous Auth session.
-- A single Auth user may own only one player account.
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
  target public.players%rowtype;
  owned_count integer;
begin
  if uid is null then
    raise exception 'authentication required';
  end if;

  select * into target
  from public.players
  where lower(trim(name)) = lower(trim(p_name))
    and pin_hash = p_pin_hash
  limit 1;

  if target.id is null then
    raise exception 'invalid account credentials';
  end if;

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
grant execute on function public.claim_player_auth(text,text) to anon, authenticated;

-- Normalized tables: no direct access without a matching player owner.
alter table public.player_progress enable row level security;
alter table public.activity_events enable row level security;
alter table public.daily_goals enable row level security;

drop policy if exists "player_progress_owner_select" on public.player_progress;
drop policy if exists "player_progress_owner_insert" on public.player_progress;
drop policy if exists "player_progress_owner_update" on public.player_progress;
create policy "player_progress_owner_select"
  on public.player_progress for select
  to authenticated
  using (player_id = public.current_player_id());
create policy "player_progress_owner_insert"
  on public.player_progress for insert
  to authenticated
  with check (player_id = public.current_player_id());
create policy "player_progress_owner_update"
  on public.player_progress for update
  to authenticated
  using (player_id = public.current_player_id())
  with check (player_id = public.current_player_id());

drop policy if exists "activity_events_owner_select" on public.activity_events;
drop policy if exists "activity_events_owner_insert" on public.activity_events;
create policy "activity_events_owner_select"
  on public.activity_events for select
  to authenticated
  using (player_id = public.current_player_id());
create policy "activity_events_owner_insert"
  on public.activity_events for insert
  to authenticated
  with check (player_id = public.current_player_id());

drop policy if exists "daily_goals_owner_select" on public.daily_goals;
drop policy if exists "daily_goals_owner_insert" on public.daily_goals;
drop policy if exists "daily_goals_owner_update" on public.daily_goals;
create policy "daily_goals_owner_select"
  on public.daily_goals for select
  to authenticated
  using (player_id = public.current_player_id());
create policy "daily_goals_owner_insert"
  on public.daily_goals for insert
  to authenticated
  with check (player_id = public.current_player_id());
create policy "daily_goals_owner_update"
  on public.daily_goals for update
  to authenticated
  using (player_id = public.current_player_id())
  with check (player_id = public.current_player_id());

revoke all on table public.player_progress from anon, authenticated;
revoke all on table public.activity_events from anon, authenticated;
revoke all on table public.daily_goals from anon, authenticated;

grant select, insert, update on table public.player_progress to authenticated;
grant select, insert on table public.activity_events to authenticated;
grant select, insert, update on table public.daily_goals to authenticated;

