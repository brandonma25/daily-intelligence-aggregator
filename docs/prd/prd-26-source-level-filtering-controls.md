# PRD-26 — Source-Level Filtering Controls

- PRD ID: `PRD-26`
- Canonical file: `docs/prd/prd-26-source-level-filtering-controls.md`
- Feature system row: update `docs/product/feature-system.csv` with matching `prd_id` and `prd_file`

## Objective
- Add user-visible source-level controls so briefing quality can be tuned without editing code or removing the broader ingestion foundation.

## Problem
- The current system can ingest and rank from multiple sources, but users still lack direct control over keeping especially noisy or low-value feeds out of their briefing.

## Scope
### Must Do
- Support source-level include, mute, or deprioritize controls.
- Make source state visible in topic/source management surfaces.
- Keep filtering decisions compatible with the existing ingestion and ranking pipeline.

### Must Not Do
- Replace the existing ingestion foundation or signal-filtering layer.
- Require manual database edits for routine source curation.

## Success Criteria
- Users can tune source participation without breaking briefing generation.
- Source controls integrate with existing management workflows.

## Done When
- One canonical PRD exists for user-facing source-level filtering controls.
