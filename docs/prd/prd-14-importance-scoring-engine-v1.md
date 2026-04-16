# PRD 14 — Importance Scoring Engine (V1)

## Objective
- Add a deterministic importance scoring layer so higher-signal articles and event cards rank above lower-signal coverage.

## Scope
- Rule-based article classification for entity signal, event type, source tier, and light recency.
- Persist article-level importance metadata.
- Rank dashboard briefing items by `importance_score` descending, then `published_at` descending.
- Show a compact signal label on event and story cards.

## Explicit Exclusions
- LLM scoring
- Personalized ranking as a primary sort signal
- Learning-to-rank or vector retrieval
- Admin tuning tools

## Acceptance Notes
- High-signal policy, macro, legal, and central-bank stories should surface above soft commentary.
- Unknown or sparse article metadata must fall back safely without crashing.
- The scoring logic lives in isolated library modules so weights and rules can be tuned later.
