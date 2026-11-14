-- Phase 2 preparation. Apply manually to a Supabase project; this app never runs migrations.
begin;

create table public.astronaut_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  crew_identifier text not null check (char_length(btrim(crew_identifier)) between 1 and 80),
  mission_name text not null check (char_length(btrim(mission_name)) between 1 and 160),
  created_at timestamptz not null default now(),
  constraint no_fictional_profile check (id <> '00000000-0000-4000-8000-000000000042')
);

create table public.health_check_ins (
  id uuid primary key default gen_random_uuid(),
  astronaut_profile_id uuid not null references public.astronaut_profiles(id) on delete cascade,
  recorded_at timestamptz not null default now() check (isfinite(recorded_at)),
  mission_local_date date not null check (mission_local_date between date '0001-01-01' and date '9999-12-31'),
  heart_rate integer check (heart_rate between 1 and 350),
  systolic integer check (systolic between 1 and 400),
  diastolic integer check (diastolic between 1 and 300),
  temperature numeric check (temperature between 20 and 50),
  spo2 numeric check (spo2 between 0 and 100),
  glucose numeric check (glucose between 1 and 2000),
  sleep numeric check (sleep between 0 and 24),
  mood text check (mood in ('calm','good','neutral','stressed','low')),
  fatigue integer check (fatigue between 0 and 10),
  exercise integer check (exercise between 0 and 1440),
  water numeric check (water between 0 and 30),
  symptoms text[] not null default '{}' check (
    cardinality(symptoms) <= 7 and array_position(symptoms, null) is null and
    symptoms <@ array['Headache','Dizziness','Nausea','Fatigue','Muscle discomfort','Sleep difficulty','Other']::text[]
  ),
  notes text not null default '' check (char_length(notes) <= 2000),
  -- Local demo records cannot be written to this future authenticated table.
  data_source text not null default 'user-entered' check (data_source = 'user-entered'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (systolic is null or diastolic is null or systolic > diastolic)
);

create index health_check_ins_profile_recorded_idx on public.health_check_ins (astronaut_profile_id, recorded_at desc, id);
create index health_check_ins_profile_mission_date_idx on public.health_check_ins (astronaut_profile_id, mission_local_date);

create function public.touch_health_check_in() returns trigger language plpgsql set search_path = '' as $$
begin
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
create trigger touch_health_check_in before update on public.health_check_ins for each row execute function public.touch_health_check_in();

alter table public.astronaut_profiles enable row level security;
alter table public.health_check_ins enable row level security;
alter table public.astronaut_profiles force row level security;
alter table public.health_check_ins force row level security;

revoke all on public.astronaut_profiles, public.health_check_ins from anon, authenticated;
grant select, insert, update, delete on public.astronaut_profiles, public.health_check_ins to authenticated;

create policy profile_select_owner on public.astronaut_profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profile_insert_owner on public.astronaut_profiles for insert to authenticated with check (user_id = (select auth.uid()));
create policy profile_update_owner on public.astronaut_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy profile_delete_owner on public.astronaut_profiles for delete to authenticated using (user_id = (select auth.uid()));

create policy check_in_select_owner on public.health_check_ins for select to authenticated using (
  exists (select 1 from public.astronaut_profiles p where p.id = astronaut_profile_id and p.user_id = (select auth.uid()))
);
create policy check_in_insert_owner on public.health_check_ins for insert to authenticated with check (
  exists (select 1 from public.astronaut_profiles p where p.id = astronaut_profile_id and p.user_id = (select auth.uid()))
);
create policy check_in_update_owner on public.health_check_ins for update to authenticated using (
  exists (select 1 from public.astronaut_profiles p where p.id = astronaut_profile_id and p.user_id = (select auth.uid()))
) with check (
  exists (select 1 from public.astronaut_profiles p where p.id = astronaut_profile_id and p.user_id = (select auth.uid()))
);
create policy check_in_delete_owner on public.health_check_ins for delete to authenticated using (
  exists (select 1 from public.astronaut_profiles p where p.id = astronaut_profile_id and p.user_id = (select auth.uid()))
);

commit;
