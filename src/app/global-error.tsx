"use client";

import Link from "next/link";

export default function GlobalError() {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-[960px] items-center px-4 py-10">
          <div className="glass-panel w-full rounded-[28px] p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Global fallback
            </p>
            <h1 className="display-font mt-3 text-3xl text-[var(--foreground)]">
              We hit a larger app error, but the workspace itself is still reachable.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
              Use the links below to recover, or clear local state if the browser is holding a stale session.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex items-center rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white"
              >
                Go home
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--foreground)]"
              >
                Open Today
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
