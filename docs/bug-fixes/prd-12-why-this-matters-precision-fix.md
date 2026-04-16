# PRD 12 — Why This Matters Precision Fix Bug Notes

## Production Failures Addressed

- Pronoun or malformed phrases were occasionally rendered as the explanation subject.
- Personal advice and Q&A content could receive policy or market-style reasoning.
- Same-entity product clusters could render near-duplicate explanations.
- Signal labels could stay too flat when content quality was weak.

## Root Cause

- Anchor extraction trusted headline/title candidates without enough validation.
- Event typing had no explicit non-signal lane for advice-like content.
- Final explanation generation did not use enough headline-level delta to separate adjacent same-entity cards.
- Signal scoring relied too much on event/topic heuristics and not enough on content quality.

## Fix

- Added stop conditions for pronouns and malformed anchor phrases.
- Added non-signal detection and forced weak treatment for advice/Q&A/lifestyle content.
- Added headline delta phrasing so same-entity cards incorporate the specific change described in each headline.
- Added regression tests for the production failure shapes.
