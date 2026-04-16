# PRD 14 Implementation Notes

- Added deterministic scoring modules in `src/lib/importance-classifier.ts` and `src/lib/importance-score.ts`.
- Stored article metadata now includes `importance_score`, `event_type`, `source_tier`, and `entity_tags`.
- Personalization remains available, but baseline ordering now stays anchored to deterministic importance rank first.
- Added a test-only dashboard fixture path for stable e2e ranking assertions in local test runs.
