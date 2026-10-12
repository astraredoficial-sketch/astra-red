alter table public.astral_events
  drop constraint if exists astral_events_activity_check;

alter table public.astral_events
  add constraint astral_events_activity_check
  check (
    activity in (
      'hair-growth',
      'hair-maintenance',
      'planting',
      'pruning-harvest',
      'moon-observation',
      'home-search',
      'home-purchase',
      'home-move',
      'vehicle-purchase',
      'vehicle-first-drive',
      'engagement',
      'wedding',
      'business-launch',
      'job-interview',
      'travel',
      'contract-signing'
    )
  );
