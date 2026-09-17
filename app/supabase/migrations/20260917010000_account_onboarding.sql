-- Returning accounts should open on the map. Accounts created after this
-- migration must complete onboarding once before the app marks them ready.
alter table public.profiles
  add column if not exists onboarding_complete boolean;

-- Rows that already existed belong to registered users from before this
-- account-level onboarding flag was introduced.
update public.profiles
set onboarding_complete = true
where onboarding_complete is null;

alter table public.profiles
  alter column onboarding_complete set default false,
  alter column onboarding_complete set not null;

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
