-- Backward-compatible preparation only. No hosted database is configured by the demo.
-- The flag records user-declared urgency; it is not a clinical classification.
alter table public.health_check_ins
  add column urgent_symptom_reported boolean not null default false;
