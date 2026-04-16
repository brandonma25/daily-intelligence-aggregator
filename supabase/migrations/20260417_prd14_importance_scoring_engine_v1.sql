alter table public.articles
  add column if not exists importance_score integer not null default 0,
  add column if not exists event_type text,
  add column if not exists source_tier text not null default 'tier3',
  add column if not exists entity_tags text[] not null default '{}'::text[];

alter table public.articles
  drop constraint if exists articles_source_tier_check;

alter table public.articles
  add constraint articles_source_tier_check
  check (source_tier in ('tier1', 'tier2', 'tier3'));
