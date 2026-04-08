"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";

type Preferences = {
  displayName: string;
  digestEnabled: boolean;
  landingPage: "/dashboard" | "/topics" | "/sources";
  readingDensity: "comfortable" | "compact";
  autoRefresh: boolean;
};

const STORAGE_KEY = "daily-intel-preferences";

export function SettingsPreferences({ defaultEmail }: { defaultEmail?: string }) {
  const defaultState = useMemo<Preferences>(
    () => ({
      displayName: defaultEmail?.split("@")[0] ?? "",
      digestEnabled: true,
      landingPage: "/dashboard",
      readingDensity: "comfortable",
      autoRefresh: true,
    }),
    [defaultEmail],
  );
  const [preferences, setPreferences] = useState<Preferences>(defaultState);
  const [savedMessage, setSavedMessage] = useState("No changes saved yet.");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as Partial<Preferences>;
      setPreferences((current) => ({ ...current, ...parsed }));
      setSavedMessage("Preferences loaded from this browser.");
    } catch {
      setSavedMessage("Could not read previous browser preferences.");
    }
  }, []);

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function savePreferences() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setSavedMessage(`Saved to this browser at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`);
  }

  return (
    <Panel className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Personal settings
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            Update your reading preferences
          </h3>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            These controls are saved in this browser today so you can immediately tune the experience.
          </p>
        </div>
        <div className="rounded-[20px] border border-[var(--line)] bg-[var(--panel)]/60 px-4 py-3 text-sm text-[var(--foreground)]">
          {savedMessage}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Display name</span>
          <input
            value={preferences.displayName}
            onChange={(event) => updatePreference("displayName", event.target.value)}
            className="w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm outline-none"
            placeholder="Brandon"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Default landing page</span>
          <select
            value={preferences.landingPage}
            onChange={(event) => updatePreference("landingPage", event.target.value as Preferences["landingPage"])}
            className="w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm outline-none"
          >
            <option value="/dashboard">Today</option>
            <option value="/topics">Topics</option>
            <option value="/sources">Sources</option>
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-[var(--foreground)]">Reading density</span>
          <select
            value={preferences.readingDensity}
            onChange={(event) => updatePreference("readingDensity", event.target.value as Preferences["readingDensity"])}
            className="w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm outline-none"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>

        <div className="space-y-3 rounded-[22px] border border-[var(--line)] bg-white/70 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Daily digest emails</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Keep reminders and briefing delivery active.
              </p>
            </div>
            <button
              type="button"
              aria-pressed={preferences.digestEnabled}
              onClick={() => updatePreference("digestEnabled", !preferences.digestEnabled)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                preferences.digestEnabled ? "bg-[var(--foreground)]" : "bg-[var(--line)]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  preferences.digestEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-3 rounded-[22px] border border-[var(--line)] bg-white/70 p-4 md:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Auto-refresh live feeds</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Keep the dashboard tuned to new public stories as they arrive.
              </p>
            </div>
            <button
              type="button"
              aria-pressed={preferences.autoRefresh}
              onClick={() => updatePreference("autoRefresh", !preferences.autoRefresh)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                preferences.autoRefresh ? "bg-[var(--foreground)]" : "bg-[var(--line)]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  preferences.autoRefresh ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={savePreferences}>
          Save preferences
        </Button>
        <Button type="button" variant="secondary" onClick={() => setPreferences(defaultState)}>
          Reset
        </Button>
      </div>
    </Panel>
  );
}
