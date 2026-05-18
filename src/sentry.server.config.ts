import * as Sentry from "@sentry/nextjs";

import {
  readSentryDsn,
  readSentryEnvironment,
  readSentryRelease,
  readSentryTracesSampleRate,
  sanitizeBreadcrumb,
  sanitizeSentryEvent,
} from "@/lib/sentry-config";

const dsn = readSentryDsn("server");

/**
 * Drop "Feed request retry exhausted" events from Sentry. These are normal,
 * expected outcomes for flaky sources (the Reuters Business feed has been
 * generating one of these per cron run for weeks). The source circuit breaker
 * + Source Health Log together record this signal in a more useful place;
 * routing the same error to Sentry just generates noise. Other RssError
 * shapes (parse errors, malformed feeds) continue to report normally.
 */
function isFeedRetryExhausted(event: unknown): boolean {
  if (!event || typeof event !== "object") return false;
  const exception = (event as { exception?: { values?: Array<{ value?: string }> } }).exception;
  const values = exception?.values;
  if (!Array.isArray(values)) return false;
  return values.some((v) => typeof v.value === "string" && v.value.includes("Feed request retry exhausted"));
}

if (dsn) {
  Sentry.init({
    dsn,
    environment: readSentryEnvironment(),
    release: readSentryRelease(),
    sendDefaultPii: false,
    tracesSampleRate: readSentryTracesSampleRate(),
    enableLogs: true,
    maxBreadcrumbs: 50,
    beforeSend(event) {
      if (isFeedRetryExhausted(event)) return null;
      return sanitizeSentryEvent(event);
    },
    beforeBreadcrumb(breadcrumb) {
      return sanitizeBreadcrumb(breadcrumb);
    },
  });
}
