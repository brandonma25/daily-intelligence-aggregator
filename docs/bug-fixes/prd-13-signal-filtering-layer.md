# Signal Filtering Layer Tuning

- related_prd_id: `PRD-13`
- related_files:
  - `src/lib/signal-filtering.ts`
  - `src/lib/data.ts`
  - `supabase/schema.sql`
  - `src/lib/signal-filtering.test.ts`
- related_commits:
  - `4abb745`
  - `49e46cb`

## Problem
- Low-value commentary, filler, and repetitive follow-ups still leaked into the briefing pipeline, while low-volume runs risked becoming too empty after filtering.

## Root Cause
- The pipeline lacked a dedicated pre-clustering filter with explicit source tiers, event gating, and a controlled fallback path when pass volume was too low.

## Fix
- Added a shared signal-filtering layer, persisted machine-readable filter metadata on articles, and introduced fallback promotion rules so thin runs could recover without fully collapsing filter intent.

## Impact
- Downstream ranking and clustering started from a cleaner article pool while still degrading gracefully when feed volume was sparse.
