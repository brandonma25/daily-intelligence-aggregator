# Temporary Cron Debug Bypass

## Summary

Adds a temporary browser-trigger helper for `GET /api/cron/fetch-news` so the daily news cron can be exercised without a bearer token in local development and Vercel preview debug sessions.

## Guardrails

- Existing `Authorization: Bearer <CRON_SECRET>` logic remains intact.
- Real production runtime still requires the existing authorization header.
- `?debug=true` is accepted only outside real production runtime, such as Vercel preview.
- Bypass use is logged with route, `NODE_ENV`, `VERCEL_ENV`, and whether `debug=true` was present.
- No secrets, request headers, cookies, or feed URLs are logged.

## Removal

This is intentionally temporary. Remove `isTemporaryCronDebugBypassAllowed` and the unauthenticated branch in `src/app/api/cron/fetch-news/route.ts` once browser-triggered cron debugging is no longer needed.
