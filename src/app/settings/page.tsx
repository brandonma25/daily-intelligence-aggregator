import Link from "next/link";

import { signOutAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SettingsPreferences } from "@/components/settings-preferences";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { getViewerAccount } from "@/lib/data";
import { env, isAiConfigured, isSupabaseConfigured } from "@/lib/env";

const workspaceItems = [
  {
    label: "Supabase URL",
    ready: isSupabaseConfigured,
    value: env.supabaseUrl || "Not connected",
    helper: "Base project URL for auth, storage, and database access.",
    actionLabel: "Open Supabase API settings",
    actionHref: "https://supabase.com/dashboard/project/fwkqjeumreaznfhnlzev/settings/api",
  },
  {
    label: "Supabase browser key",
    ready: isSupabaseConfigured,
    value: env.supabaseAnonKey ? "Connected in production" : "Not connected",
    helper: "Client-side key used by the browser to establish user sessions safely.",
    actionLabel: "Review browser key",
    actionHref: "https://supabase.com/dashboard/project/fwkqjeumreaznfhnlzev/settings/api",
  },
  {
    label: "AI provider key",
    ready: isAiConfigured,
    value: env.openAiApiKey ? "Connected in production" : "Missing from deployment",
    helper: "Used for AI summaries and higher-quality briefing synthesis.",
    actionLabel: isAiConfigured ? "Review deployment env docs" : "Open env setup docs",
    actionHref: "https://vercel.com/docs/environment-variables",
  },
];

const connectedCount = workspaceItems.filter((item) => item.ready).length;

export default async function SettingsPage() {
  const viewer = await getViewerAccount();

  return (
    <AppShell currentPath="/settings" mode={isSupabaseConfigured ? "live" : "demo"} account={viewer}>
      <div className="space-y-6 py-2">
        <PageHeader
          eyebrow="Settings"
          title="Keep the workspace healthy and personalized"
          description="This page now separates deployment setup from personal preferences so you can scan status quickly and take action without hunting through docs."
          aside={
            <Panel className="border border-[rgba(31,79,70,0.14)] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Setup progress
              </p>
              <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
                {connectedCount}/3
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {connectedCount === workspaceItems.length
                  ? "All core services are connected."
                  : "Core services still need attention before the full live workflow is unlocked."}
              </p>
            </Panel>
          }
        />

        <Panel id="workspace-setup" className="p-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Workspace setup
            </p>
            <h2 className="text-2xl font-semibold text-[var(--foreground)]">
              Service connections
            </h2>
            <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">
              Each service card now shows status, why it matters, and where to manage it.
            </p>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {workspaceItems.map((item) => (
              <Panel
                key={item.label}
                className={`p-6 ${
                  item.ready
                    ? "border border-[rgba(31,79,70,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(243,249,247,0.92))]"
                    : "border border-[rgba(148,72,53,0.16)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(250,245,241,0.94))]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
                  <Badge className={item.ready ? "border-[rgba(31,79,70,0.18)] bg-[rgba(31,79,70,0.10)] text-[var(--accent)]" : "border-[rgba(148,72,53,0.18)] bg-[rgba(148,72,53,0.08)] text-[#944835]"}>
                    {item.ready ? "Ready" : "Pending"}
                  </Badge>
                </div>
                <p className="mt-4 text-sm font-medium text-[var(--foreground)]">{item.value}</p>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.helper}</p>
                <a
                  href={item.actionHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center justify-center rounded-full border border-[var(--line)] bg-white/75 px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-white"
                >
                  {item.actionLabel}
                </a>
              </Panel>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SettingsPreferences defaultEmail={viewer?.email} />

          <div className="space-y-6">
            <Panel id="account-management" className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Account management
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                Ownership and safety
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Keep the account safe, understand where to manage credentials, and move quickly when something needs attention.
              </p>

              <div className="mt-6 space-y-3">
                <Link
                  href="/sources"
                  className="flex items-center justify-between rounded-[22px] border border-[var(--line)] bg-white/70 px-4 py-4 text-sm font-medium text-[var(--foreground)]"
                >
                  <span>Review saved sources</span>
                  <span className="text-[var(--muted)]">Open</span>
                </Link>
                <Link
                  href="/topics"
                  className="flex items-center justify-between rounded-[22px] border border-[var(--line)] bg-white/70 px-4 py-4 text-sm font-medium text-[var(--foreground)]"
                >
                  <span>Manage briefing topics</span>
                  <span className="text-[var(--muted)]">Open</span>
                </Link>
                <a
                  href="https://supabase.com/dashboard/project/fwkqjeumreaznfhnlzev/auth/users"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-[22px] border border-[var(--line)] bg-white/70 px-4 py-4 text-sm font-medium text-[var(--foreground)]"
                >
                  <span>Review auth users in Supabase</span>
                  <span className="text-[var(--muted)]">External</span>
                </a>
              </div>

              {viewer ? (
                <form action={signOutAction} className="mt-6">
                  <Button type="submit" variant="secondary" className="w-full">
                    Sign out
                  </Button>
                </form>
              ) : (
                <Link href="/#email-access" className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(19,26,34,0.16)]">
                  Sign in
                </Link>
              )}
            </Panel>

            <Panel id="account-settings" className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Current session
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                Status at a glance
              </h2>
              <div className="mt-5 space-y-3">
                <div className="rounded-[22px] border border-[var(--line)] bg-white/70 p-4">
                  <p className="text-sm font-medium text-[var(--foreground)]">Signed-in user</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {viewer ? viewer.email : "No active user session detected."}
                  </p>
                </div>
                <div className="rounded-[22px] border border-[var(--line)] bg-white/70 p-4">
                  <p className="text-sm font-medium text-[var(--foreground)]">Workspace mode</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {isSupabaseConfigured
                      ? "Live services are connected. Guest users still fall back to public feed mode until they sign in."
                      : "The app is still in demo-oriented setup mode until Supabase is fully configured."}
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
