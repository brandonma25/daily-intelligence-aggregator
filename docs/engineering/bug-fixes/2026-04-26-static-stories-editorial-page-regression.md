# Static Stories + Editorial + Account Page Regression — Bug-Fix Note

- Detailed branch report: `docs/bugs/2026-04-26-regression-static-stories-editorial-page.md`
- Regression summary:
  - homepage public SSR fell back to demo briefing copy when no live published `signal_posts` existed
  - editorial review still generated fresh Top 5 signals during render and hit a recoverable server error
  - `/account` still invoked the dashboard loader during SSR and hit a recoverable server error in preview
- Fix summary:
  - homepage now prefers persisted `signal_posts` snapshots before using an honest category-specific static placeholder set
  - editorial review now reads stored signal rows only and degrades to a warning + empty state when no snapshot exists
  - `/account` now reads only auth, `user_profiles`, and `sources` instead of invoking dashboard generation or sync work during SSR
- Safety note:
  - homepage/account/category/editorial render paths remain isolated from feed parsing and ingestion during SSR
