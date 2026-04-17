# Why This Matters Precision Failures

- related_prd_id: `PRD-12`
- related_files:
  - `src/lib/why-it-matters.ts`
  - `src/lib/event-intelligence.ts`
  - `src/lib/types.ts`
- related_commits:
  - `6322135`
  - `d4566f4`
  - `b16d09e`
  - `a5634ec`

## Problem
- Early `why_it_matters` output drifted into weak anchors, repetitive phrasing, and overconfident explanations on thin evidence.

## Root Cause
- Subject selection, event routing, and signal calibration were not strict enough, so low-quality anchors and generic causal phrasing leaked into the output.

## Fix
- Tightened entity validation, introduced event-specific routing, constrained non-signal handling, reduced batch-level repetition, and recalibrated early-signal language for sparse stories.

## Impact
- The reasoning layer became more specific and less repetitive, which made downstream explanation quality safer for homepage and dashboard use.
