-- Preparation only: requires explicit approval before applying to any project.
begin;
alter table public.astronaut_profiles
  add column mission_environment text not null default 'other'
    check (mission_environment in ('space-station','spacecraft','lunar-base','mars-base','other')),
  add column mission_start_date date check (mission_start_date between date '0001-01-01' and date '9999-12-31'),
  add column role text check (role is null or char_length(btrim(role)) between 1 and 120);

-- Identifiers cannot be transferred to another owner even by an owner UPDATE.
create function public.keep_profile_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.user_id is distinct from old.user_id then
    raise exception 'Profile identity cannot be changed' using errcode = '42501';
  end if;
  new.created_at := old.created_at;
  return new;
end;
$$;
create trigger keep_profile_identity before update on public.astronaut_profiles
  for each row execute function public.keep_profile_identity();

create function public.keep_check_in_identity() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.id is distinct from old.id or new.astronaut_profile_id is distinct from old.astronaut_profile_id then
    raise exception 'Check-in identity cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger keep_check_in_identity before update on public.health_check_ins
  for each row execute function public.keep_check_in_identity();

-- NOT VALID preserves historical zero/ambiguous rows. New inserts/updates must
-- satisfy this rule. Inventory legacy values before any approved correction;
-- do not UPDATE or DELETE them as a side effect of this migration.
alter table public.health_check_ins add constraint spo2_new_write_range
  check (spo2 is null or spo2 between 1 and 100) not valid;

-- Existing forced RLS and owner-only SELECT/INSERT/UPDATE/DELETE policies stay
-- active. Reassert grants; no anonymous private profile or health access.
revoke all on public.astronaut_profiles, public.health_check_ins from anon;
revoke execute on function public.keep_profile_identity() from public, anon, authenticated;
revoke execute on function public.keep_check_in_identity() from public, anon, authenticated;
commit;
