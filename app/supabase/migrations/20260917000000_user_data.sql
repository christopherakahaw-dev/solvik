-- Solvik account data. Location traces, search history and learned journeys are
-- intentionally absent: those remain on the user's device.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  cloud_sync boolean not null default false,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_places (
  user_id uuid not null references auth.users(id) on delete cascade,
  place_key text not null check (place_key in ('home', 'work', 'school')),
  place jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, place_key)
);

create table if not exists public.saved_commutes (
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null check (position >= 0),
  commute jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, position)
);

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.saved_places enable row level security;
alter table public.saved_commutes enable row level security;

revoke all on table public.profiles, public.user_preferences, public.saved_places, public.saved_commutes from anon, authenticated;
grant select, insert, update, delete on table public.profiles, public.user_preferences, public.saved_places, public.saved_commutes to authenticated;

create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

create policy "preferences_select_own" on public.user_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy "preferences_insert_own" on public.user_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "preferences_update_own" on public.user_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "preferences_delete_own" on public.user_preferences for delete to authenticated using ((select auth.uid()) = user_id);

create policy "places_select_own" on public.saved_places for select to authenticated using ((select auth.uid()) = user_id);
create policy "places_insert_own" on public.saved_places for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "places_update_own" on public.saved_places for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "places_delete_own" on public.saved_places for delete to authenticated using ((select auth.uid()) = user_id);

create policy "commutes_select_own" on public.saved_commutes for select to authenticated using ((select auth.uid()) = user_id);
create policy "commutes_insert_own" on public.saved_commutes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "commutes_update_own" on public.saved_commutes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "commutes_delete_own" on public.saved_commutes for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, onboarding_complete)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.sync_user_data(
  p_places jsonb,
  p_preferences jsonb,
  p_commutes jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_preferences (user_id, preferences, updated_at)
  values (caller_id, coalesce(p_preferences, '{}'::jsonb), now())
  on conflict (user_id) do update
    set preferences = excluded.preferences, updated_at = excluded.updated_at;

  delete from public.saved_places where user_id = caller_id;
  insert into public.saved_places (user_id, place_key, place, updated_at)
  select caller_id, entry.key, entry.value, now()
  from jsonb_each(coalesce(p_places, '{}'::jsonb)) as entry
  where entry.key in ('home', 'work', 'school') and entry.value <> 'null'::jsonb;

  delete from public.saved_commutes where user_id = caller_id;
  insert into public.saved_commutes (user_id, position, commute, updated_at)
  select caller_id, (entry.ordinality - 1)::integer, entry.value, now()
  from jsonb_array_elements(coalesce(p_commutes, '[]'::jsonb)) with ordinality as entry(value, ordinality);
end;
$$;

revoke all on function public.sync_user_data(jsonb, jsonb, jsonb) from public, anon;
grant execute on function public.sync_user_data(jsonb, jsonb, jsonb) to authenticated;

create or replace function public.clear_user_data()
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  delete from public.saved_commutes where user_id = caller_id;
  delete from public.saved_places where user_id = caller_id;
  delete from public.user_preferences where user_id = caller_id;
  update public.profiles set cloud_sync = false, updated_at = now() where id = caller_id;
end;
$$;

revoke all on function public.clear_user_data() from public, anon;
grant execute on function public.clear_user_data() to authenticated;
