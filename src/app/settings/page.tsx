import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { getViewerAccount } from "@/lib/data";
import { env, isAiConfigured, isSupabaseConfigured } from "@/lib/env";

const setupItems = [
  {
    label: "Supabase URL",
    ready: isSupabaseConfigured,
    value: env.supabaseUrl || "Not connected",
  },
  {
    label: "Supabase anon key",
    ready: isSupabaseConfigured,
    value: env.supabaseAnonKey ? "Connected" : "Not connected",
  },
  {
    label: "AI provider key",
    ready: isAiConfigured,
    value: env.openAiApiKey ? "Connected" : "Not connected",
  },
];

const userSettingFeatures = [
  {
    title: "Profile details",
    description: "Name, preferred email, and the account identity shown across the app.",
  },
  {
    title: "Briefing preferences",
    description: "Default topics, reading order, and whether the dashboard should open in personal or public mode.",
  },
  {
    title: "Source controls",
    description: "Saved feeds, paused publishers, import defaults, and source health visibility.",
  },
  {
    title: "Delivery cadence",
    description: "Email digests, refresh timing, and notification reminders for the daily briefing window.",
  },
  {
    title: "Security and sessions",
    description: "Magic-link login activity, sign-out from other devices, and account verification status.",
  },
  {
    title: "Data controls",
    description: "Export briefing history, clear saved reads, and request account deletion when needed.",
  },
];

export default async function SettingsPage() {
  const viewer = await getViewerAccount();

  return (
    <AppShell currentPath="/settings" mode={isSupabaseConfigured ? "live" : "demo"} account={viewer}>
      <div className="space-y-6 py-2">
        <PageHeader
          eyebrow="Settings"
          title="Connect the services that power the live product"
          description="The app runs in demo mode without setup. Add Supabase and your AI key when you are ready to save user data, ingest live feeds, and generate real briefings."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {setupItems.map((item) => (
            <Panel key={item.label} className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--foreground)]">{item.label}</p>
                <Badge className={item.ready ? "text-[var(--accent)]" : ""}>
                  {item.ready ? "Ready" : "Pending"}
                </Badge>
              </div>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">{item.value}</p>
            </Panel>
          ))}
        </div>

        <Panel id="user-settings" className="scroll-mt-24 p-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                User settings
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
                Account management
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--muted)]">
                This is the right home for account-level controls that shape the briefing experience for each signed-in reader.
              </p>
            </div>
            {viewer ? (
              <div className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-4 text-sm leading-7 text-[var(--foreground)]">
                Signed in as <span className="font-semibold">{viewer.email}</span>
              </div>
            ) : (
              <div className="rounded-[24px] border border-[var(--line)] bg-white/70 px-5 py-4 text-sm leading-7 text-[var(--foreground)]">
                Sign in to unlock personal account controls and saved briefing preferences.
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {userSettingFeatures.map((item) => (
              <div key={item.title} className="rounded-[22px] border border-[var(--line)] bg-white/60 p-5">
                <h3 className="text-base font-semibold text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">What you need for launch</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {[
              "A Supabase project for login and the database.",
              "An OpenAI-compatible API key for summaries.",
              "A Vercel account for deployment.",
              "Your starting list of RSS feeds and topic categories.",
            ].map((line) => (
              <div key={line} className="rounded-[22px] border border-[var(--line)] bg-white/60 p-4 text-sm leading-7 text-[var(--foreground)]">
                {line}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
