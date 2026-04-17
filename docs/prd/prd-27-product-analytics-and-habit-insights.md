# PRD-27 — Product Analytics and Habit Insights

- PRD ID: `PRD-27`
- Canonical file: `docs/prd/prd-27-product-analytics-and-habit-insights.md`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective
- Add lightweight analytics and habit insight reporting so the product can show usage patterns and reading behavior without overwhelming the core briefing experience.

## Problem
- The system has continuity and reading-window primitives, but it does not yet expose higher-level usage or habit insights that help users evaluate their scanning behavior over time.

## Scope
### Must Do
- Build non-sensitive aggregate usage metrics on top of existing briefing state.
- Surface concise insight modules tied to reading and briefing habits.
- Keep analytics separate from ranking-critical data paths.

### Must Not Do
- Introduce invasive tracking or sensitive telemetry into repo docs.
- Block core briefing flows on analytics availability.

## Success Criteria
- Users can access concise habit-level insights grounded in existing product activity.
- Analytics degrade safely when historical data is sparse.

## Done When
- One canonical PRD exists for lightweight analytics and habit insights.
