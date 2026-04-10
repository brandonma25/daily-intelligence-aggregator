"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: Props) {
  useEffect(() => {
    console.error("Route error boundary triggered.", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-10">
      <div className="glass-panel w-full rounded-[28px] p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(148,72,53,0.10)] text-[#944835]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Temporary issue
            </p>
            <h1 className="display-font text-3xl text-[var(--foreground)]">
              This page hit a server problem, but the app is still recoverable.
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Try the page again, or head back to the dashboard shell while we fall back to safer defaults.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Retry page
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Open Today
              </Link>
              <button
                type="button"
                onClick={() => {
                  window.localStorage.removeItem("daily-intel-sidebar-collapsed");
                  window.localStorage.removeItem("daily-intel-preferences");
                  window.location.href = "/";
                }}
                className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Reset local state
              </button>
            </div>
            {error.digest ? (
              <p className="text-xs leading-6 text-[var(--muted)]">Error digest: {error.digest}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
