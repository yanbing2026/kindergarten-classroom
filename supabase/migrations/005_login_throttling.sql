-- Server-side login throttling for player PIN verification.
-- Run after 004_protect_players_rls.sql.
create table if not exists public.player_login_attempts (
  player_key text primary key,
  failed_count integer not null default 0,
  locked_until timestamptz
);

alter table public.player_login_attempts enable row level security;
revoke all on table public.player_login_attempts from anon, authenticated;

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

  insert into public.player_login_attempts(player_key,failed_count,locked_until)
  values(k,1,null)
  on conflict(player_key) do update
    set failed_count=public.player_login_attempts.failed_count+1,
        locked_until=case
          when public.player_login_attempts.failed_count+1 >= 5
          then now()+interval '30 seconds'
          else null
        end;

  return;
end;
$$;

grant execute on function public.login_player(text,text) to anon, authenticated;
