-- Optional integration test: run against a disposable local Supabase database
-- after migrations with `supabase test db`. Never use production for fixture tests.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(30);

insert into auth.users(id,email) values
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','fixture-a@example.invalid'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','fixture-b@example.invalid');
insert into public.astronaut_profiles(id,user_id,display_name,crew_identifier,mission_name) values
 ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Fixture A','TEST-A','Test mission'),
 ('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Fixture B','TEST-B','Test mission');
insert into public.health_check_ins(id,astronaut_profile_id,mission_local_date,heart_rate) values
 ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','2026-11-14',70),
 ('44444444-4444-4444-8444-444444444444','22222222-2222-4222-8222-222222222222','2026-11-14',75);

set local role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
select is((select count(*) from public.astronaut_profiles)::integer,1,'Owner A sees only own profile');
select is((select count(*) from public.health_check_ins)::integer,1,'Owner A sees only own records');
select is((select count(*) from public.health_check_ins where id='44444444-4444-4444-8444-444444444444')::integer,0,'Other owner record is invisible');
select lives_ok($$insert into public.health_check_ins(id,astronaut_profile_id,mission_local_date) values ('55555555-5555-4555-8555-555555555555','11111111-1111-4111-8111-111111111111','2026-11-14')$$,'Owner can insert own check-in');
select throws_ok($$insert into public.health_check_ins(astronaut_profile_id,mission_local_date) values ('22222222-2222-4222-8222-222222222222','2026-11-14')$$,'42501',null,'Cannot insert into another profile');
select throws_ok($$insert into public.astronaut_profiles(user_id,display_name,crew_identifier,mission_name) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Impersonator','X','Test')$$,'42501',null,'Cannot insert another user profile');
select throws_ok($$update public.health_check_ins set astronaut_profile_id='22222222-2222-4222-8222-222222222222' where id='33333333-3333-4333-8333-333333333333'$$,'42501',null,'Cannot transfer check-in ownership');
select throws_ok($$update public.astronaut_profiles set user_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' where id='11111111-1111-4111-8111-111111111111'$$,'42501',null,'Cannot transfer profile ownership');
select results_eq($$update public.health_check_ins set heart_rate=80 where id='44444444-4444-4444-8444-444444444444' returning id$$,$$select null::uuid where false$$,'Cannot update another owner record');
select results_eq($$delete from public.health_check_ins where id='44444444-4444-4444-8444-444444444444' returning id$$,$$select null::uuid where false$$,'Cannot delete another owner record');
select lives_ok($$update public.health_check_ins set heart_rate=78 where id='33333333-3333-4333-8333-333333333333'$$,'Owner can update own record');
select is((select heart_rate from public.health_check_ins where id='33333333-3333-4333-8333-333333333333'),78,'Own update persisted');
select throws_ok($$insert into public.health_check_ins(astronaut_profile_id,mission_local_date,data_source) values ('11111111-1111-4111-8111-111111111111','2026-11-14','synthetic')$$,'23514',null,'Cloud storage rejects synthetic sources');
select throws_ok($$insert into public.health_check_ins(astronaut_profile_id,mission_local_date,spo2) values ('11111111-1111-4111-8111-111111111111','2026-11-14',101)$$,'23514',null,'Database rejects invalid measurements');
select lives_ok($$delete from public.health_check_ins where id='55555555-5555-4555-8555-555555555555'$$,'Owner can delete own check-in');
select lives_ok($$update public.astronaut_profiles set role='Simulation specialist' where id='11111111-1111-4111-8111-111111111111'$$,'Owner can edit own profile');
select is((select role from public.astronaut_profiles where id='11111111-1111-4111-8111-111111111111'),'Simulation specialist','Profile edit persisted');
select throws_ok($$update public.astronaut_profiles set mission_environment='unknown' where id='11111111-1111-4111-8111-111111111111'$$,'23514',null,'Invalid mission environment is rejected');
select throws_ok($$update public.astronaut_profiles set id='77777777-7777-4777-8777-777777777777' where id='11111111-1111-4111-8111-111111111111'$$,'42501',null,'Profile identity is immutable');
select throws_ok($$insert into public.health_check_ins(astronaut_profile_id,mission_local_date,spo2) values ('11111111-1111-4111-8111-111111111111','2026-11-14',0)$$,'23514',null,'New zero oxygen is rejected');
select lives_ok($$insert into public.health_check_ins(astronaut_profile_id,mission_local_date,spo2) values ('11111111-1111-4111-8111-111111111111','2026-11-14',null)$$,'Missing oxygen is allowed');
select lives_ok($$insert into public.health_check_ins(astronaut_profile_id,mission_local_date,spo2) values ('11111111-1111-4111-8111-111111111111','2026-11-14',98.5)$$,'Decimal oxygen is allowed');
select results_eq($$update public.astronaut_profiles set display_name='Intruder' where id='22222222-2222-4222-8222-222222222222' returning id$$,$$select null::uuid where false$$,'Cannot update another owner profile');
select results_eq($$delete from public.astronaut_profiles where id='22222222-2222-4222-8222-222222222222' returning id$$,$$select null::uuid where false$$,'Cannot delete another owner profile');
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',true);
select is((select count(*) from public.health_check_ins)::integer,1,'Owner B sees only own record');
select is((select heart_rate from public.health_check_ins where id='44444444-4444-4444-8444-444444444444'),75,'Owner B record was unchanged');
reset role;
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select throws_ok($$select * from public.astronaut_profiles$$,'42501',null,'Anonymous cannot read profiles');
select throws_ok($$insert into public.astronaut_profiles(user_id,display_name,crew_identifier,mission_name) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Anon','X','Test')$$,'42501',null,'Anonymous cannot write profiles');
select throws_ok($$select * from public.health_check_ins$$,'42501',null,'Anonymous cannot read check-ins');
select throws_ok($$insert into public.health_check_ins(astronaut_profile_id,mission_local_date) values ('11111111-1111-4111-8111-111111111111','2026-11-14')$$,'42501',null,'Anonymous cannot write check-ins');
reset role;
select * from finish();
rollback;
