import { NextResponse } from "next/server";

import { runDailyNewsCron } from "@/lib/cron/fetch-news";
import { logServerEvent } from "@/lib/observability";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CRON_ROUTE = "/api/cron/fetch-news";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization")?.trim() ?? "";

  return Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;
}

function isProductionRuntime() {
  const vercelEnv = process.env.VERCEL_ENV;

  return process.env.NODE_ENV === "production" && vercelEnv !== "preview" && vercelEnv !== "development";
}

function isTemporaryCronDebugBypassAllowed(request: Request) {
  const url = new URL(request.url);
  const debugRequested = url.searchParams.get("debug") === "true";
  const nodeEnvAllowsBypass = process.env.NODE_ENV !== "production";

  // Temporary browser-trigger helper. Remove this helper and the GET branch below
  // once cron debugging no longer needs an unauthenticated local/preview path.
  return !isProductionRuntime() && (nodeEnvAllowsBypass || debugRequested);
}

export async function GET(request: Request) {
  if (!isAuthorized(request) && !isTemporaryCronDebugBypassAllowed(request)) {
    logServerEvent("warn", "Unauthorized daily news cron request rejected", {
      route: CRON_ROUTE,
      hasCronSecret: Boolean(process.env.CRON_SECRET?.trim()),
    });

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        summary: {
          message: "Unauthorized",
        },
      },
      { status: 401 },
    );
  }

  if (!isAuthorized(request)) {
    const url = new URL(request.url);

    logServerEvent("warn", "Temporary daily news cron auth bypass used", {
      route: CRON_ROUTE,
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      debugParam: url.searchParams.get("debug") === "true",
    });
  }

  const result = await runDailyNewsCron();

  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
