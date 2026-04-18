# PRD-32 — Phase 1 Pipeline

- PRD ID: `PRD-32`
- Canonical file: `docs/product/prd/prd-32-phase1-pipeline.md`
- Feature system row: `docs/product/feature-system.csv`

## Objective

Ship a working Phase 1 news intelligence pipeline that is cluster-first, deterministic, inspectable, and able to produce a readable ranked digest without relying on heavy LLM reasoning.

## User Problem

The product needs an end-to-end intelligence path that can ingest live news, normalize it, remove duplicates, cluster related articles, rank signals with explainable logic, and render a concise digest on the dashboard.

## Scope

- Add explicit pipeline modules for ingestion, normalization, deduplication, clustering, ranking, and digest generation.
- Add typed models for raw items, normalized articles, signal clusters, and ranked signals.
- Add deterministic scoring for credibility, novelty, urgency, and reinforcement.
- Add pipeline observability with run summaries and per-cluster scoring breakdown.
- Wire the public dashboard briefing generation to the new digest pipeline.
- Add donor adapters and deterministic seed fallback coverage for local/dev resilience.

## Non-Goals

- No heavy LLM reasoning in the ranking path.
- No auth, Supabase, or session architecture rewrite.
- No production-grade persistence layer for pipeline runs in Phase 1.
- No semantic embeddings or model-based clustering in Phase 1.

## Implementation Shape / System Impact

- `src/lib/pipeline/` now owns the staged deterministic processing flow.
- `src/lib/models/` defines the phase-specific pipeline contracts.
- `src/lib/scoring/scoring-engine.ts` centralizes ranking math.
- `src/lib/observability/pipeline-run.ts` records run counts, failures, and scoring logs.
- `src/adapters/donors/` defines the 4 donor families and their default RSS feeds.
- `src/lib/data.ts` uses the new digest pipeline for public dashboard briefing generation while leaving auth-sensitive flows intact.

## Dependencies / Risks

- RSS feeds are network-dependent and can fail, throttle, or change shape.
- Keyword clustering is intentionally naive and may over-group adjacent stories or split evolving events.
- The current public dashboard path infers topic assignment from keywords and source mix rather than a deeper taxonomy model.
- Seed fallback keeps local/dev usable, but it is a resilience mechanism rather than a substitute for live feed quality.

## Acceptance Criteria

- The pipeline fetches 3 to 5 feeds with retry logic.
- Inputs normalize into a common `NormalizedArticle` model.
- Duplicate or near-duplicate items are removed deterministically.
- Related articles are grouped into clusters with keyword/similarity matching.
- Ranking produces explainable non-identical scores.
- Digest output returns the top 5 ranked clusters with title, summary, and source links.
- Observability captures run counts and score breakdowns per cluster.

## Scoring Logic

`score = 0.3 * credibility + 0.25 * novelty + 0.25 * urgency + 0.2 * reinforcement`

- `credibility`: average deterministic source credibility weight across the cluster
- `novelty`: rewards scarcer topic keywords and keyword breadth
- `urgency`: rewards fresher stories and explicit urgent event language
- `reinforcement`: rewards cluster size and source diversity

## Known Limitations

- Title and keyword overlap can still confuse adjacent macro or policy stories.
- The dashboard summary is deterministic and intentionally basic.
- Topic assignment for public digest cards is heuristic in Phase 1.
- Observability currently logs to runtime output instead of a persistent analytics store.

## Evidence and Confidence

- Repo evidence used:
  - `src/lib/data.ts`
  - `src/lib/pipeline/`
  - `src/lib/scoring/scoring-engine.ts`
  - `src/lib/observability/pipeline-run.ts`
- Confidence: Medium-high for local deterministic behavior; medium for live-feed quality because external RSS availability varies.
