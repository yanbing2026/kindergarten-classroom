-- Server-side membership validation for the daily free-time limit.
-- Run once in the Supabase SQL Editor. Safe to run more than once.
--
-- Model: membership is per device. Parents buy (e.g. via a Stripe Payment
-- Link), the owner inserts a single-use code (see bottom), the parent redeems
-- it in the app's Membership screen. Each code works on exactly one device.
-- The client re-validates with check_device_membership() every 15 minutes;
-- the server verdict overrides any localStorage flag, so a forged local flag
-- is revoked on the next online check.

create table if not exists public.membership_codes (
  code text primary key,
  is_used boolean not null default false,
  used_at timestamptz,
  used_by_device text,
  -- Null = lifetime. Set duration_days to auto-expire, e.g. 365 for one year.
  duration_days integer,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  note text
);

alter table public.membership_codes enable row level security;
-- Intentionally no policies: direct table access is denied for anon and
-- authenticated roles. All access goes through the SECURITY DEFINER
-- functions below.

create or replace function public.redeem_membership_code(p_code text, p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_duration integer;
begin
  if p_code is null or p_device_id is null
     or length(trim(p_code)) = 0 or length(trim(p_device_id)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  select duration_days into v_duration
    from public.membership_codes
   where code = trim(p_code)
     and is_used = false
   for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'invalid');
  end if;

  update public.membership_codes
     set is_used = true,
         used_at = now(),
         used_by_device = trim(p_device_id),
         expires_at = case
           when v_duration is not null
           then now() + (v_duration || ' days')::interval
           else null
         end
   where code = trim(p_code);

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.check_device_membership(p_device_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_device_id is null or length(trim(p_device_id)) = 0 then
    return jsonb_build_object('is_member', false);
  end if;

  if exists (
    select 1 from public.membership_codes
     where used_by_device = trim(p_device_id)
       and is_used = true
       and (expires_at is null or expires_at > now())
  ) then
    return jsonb_build_object('is_member', true);
  end if;

  return jsonb_build_object('is_member', false);
end;
$$;

-- The browser uses the publishable key as anon: allow it to call these RPCs.
grant execute on function public.redeem_membership_code(text, text) to anon, authenticated;
grant execute on function public.check_device_membership(text) to anon, authenticated;

-- ---- Issue codes (owner only: run manually in the SQL editor, never in the client) ----
-- Lifetime code:
-- insert into public.membership_codes (code, note) values ('BRIGHT-0420-KITE', 'lifetime demo');
-- One-year code:
-- insert into public.membership_codes (code, duration_days, note) values ('YEAR-2026-7F3A', 365, '1-year plan');
-- List unused codes:
-- select code, duration_days, created_at, note from public.membership_codes where is_used = false;
