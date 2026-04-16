# PRD 12 — Why This Matters Precision Fix

## Summary

This follow-up fix tightens PRD 12 output quality after production QA exposed unsafe subject anchoring and non-signal content being explained as macro or policy moves.

## What Changed

- Added stronger entity validation so pronouns and malformed partial phrases do not become subjects.
- Added a non-signal content lane for advice, Q&A, and lifestyle-style articles.
- Improved same-entity differentiation by incorporating headline-specific change cues into the reasoning path.
- Kept non-fallback outputs subject-first and reduced generic cluster-level reuse.
- Recalibrated signal strength so non-signal and low-quality stories do not inherit stronger labels by topic alone.

## Scope

- `src/lib/event-intelligence.ts`
- `src/lib/why-it-matters.ts`
- targeted regression tests

## Out of Scope

- UI redesign
- auth/session changes
- PRD 13 signal filtering changes beyond consuming existing metadata safely
