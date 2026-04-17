# Homepage Category Rails and Empty States

- related_prd_id: `PRD-17`
- related_files:
  - `src/components/landing/homepage.tsx`
  - `src/lib/homepage-model.ts`
  - `src/lib/homepage-taxonomy.ts`
  - `src/app/page.tsx`
- related_commits:
  - `88f125d`
  - `67ae05a`

## Problem
- Homepage category rails could render sparsely or collapse into confusing blank sections, especially when the ranked input set was uneven across categories.

## Root Cause
- The homepage model and taxonomy logic did not yet handle sparse allocation, preview-versus-dashboard separation, and empty-state messaging as first-class concerns.

## Fix
- Tightened homepage-model allocation rules, improved category taxonomy handling, and separated the homepage preview experience from the deeper dashboard flow so empty states could be explained intentionally.

## Impact
- The homepage became more resilient under uneven feed conditions and stopped looking visually broken when category coverage was thin.
