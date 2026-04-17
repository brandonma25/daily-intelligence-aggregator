# Repo Hygiene Sanity Check

- related_prd_id: `none`
- related_files:
  - `README.md`
  - `.env.example`
  - `.gitignore`
  - `QA-LIVE-TEST-2026-04-15.md`
  - `src/components/auth/auth-modal.test.tsx`
- related_commit: `c3dc7c7`

## Problem
- Public-facing docs and tests contained environment-specific details that were too specific for a public repository.

## Root Cause
- Active debugging notes and setup instructions were committed faster than they were normalized back to reusable placeholders.

## Fix
- Replaced deployment-specific references with placeholders, added a tracked `.env.example`, preserved ignore rules for real env files, and sanitized test and QA references that exposed project-specific hosts.

## Impact
- The repo became safer to share publicly without losing basic setup guidance.
