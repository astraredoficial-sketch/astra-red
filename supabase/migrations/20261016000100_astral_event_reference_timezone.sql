alter table public.astral_events
  add column if not exists reference_timezone text not null default 'UTC'
  check (char_length(trim(reference_timezone)) between 1 and 100);
