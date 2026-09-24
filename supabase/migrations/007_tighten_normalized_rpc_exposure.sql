-- Tighten RPC exposure after normalized RLS rollout.
-- Account creation/login/salt lookup remain callable before Auth login.
-- Ownership binding and owner-id lookup require an authenticated session.

revoke execute on function public.claim_player_auth(text,text) from anon;
grant execute on function public.claim_player_auth(text,text) to authenticated;

revoke execute on function public.current_player_id() from anon;
grant execute on function public.current_player_id() to authenticated;

drop policy if exists "player_progress owner select" on public.player_progress;
drop policy if exists "player_progress owner insert" on public.player_progress;
drop policy if exists "player_progress owner update" on public.player_progress;
drop policy if exists "activity_events owner select" on public.activity_events;
drop policy if exists "activity_events owner insert" on public.activity_events;
drop policy if exists "daily_goals owner select" on public.daily_goals;
drop policy if exists "daily_goals owner insert" on public.daily_goals;
drop policy if exists "daily_goals owner update" on public.daily_goals;
