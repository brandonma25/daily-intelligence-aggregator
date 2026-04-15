"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import {
  buildPersonalizationSummary,
  createDefaultPersonalizationProfile,
  parsePersonalizationProfile,
  persistPersonalizationProfile,
  type BriefingPersonalizationProfile,
  type PersonalizationTopicOption,
} from "@/lib/personalization";

type SettingsPreferencesProps = {
  defaultEmail?: string;
  availableTopics: PersonalizationTopicOption[];
  suggestedEntities: string[];
  signedIn: boolean;
};

export function SettingsPreferences({
  defaultEmail,
  availableTopics,
  suggestedEntities,
  signedIn,
}: SettingsPreferencesProps) {
  const defaultState = useMemo<BriefingPersonalizationProfile>(
    () => createDefaultPersonalizationProfile(defaultEmail),
    [defaultEmail],
  );
  const [preferences, setPreferences] = useState<BriefingPersonalizationProfile>(() => {
    const stored = typeof window === "undefined" ? null : window.localStorage.getItem("daily-intel-preferences");
    return parsePersonalizationProfile(stored, defaultEmail);
  });
  const [savedMessage, setSavedMessage] = useState(() => {
    if (typeof window === "undefined") {
      return "No changes saved yet.";
    }

    return window.localStorage.getItem("daily-intel-preferences")
      ? "Preferences loaded from this browser."
      : "No changes saved yet.";
  });
  const [entityInput, setEntityInput] = useState("");

  function updatePreference<K extends keyof BriefingPersonalizationProfile>(
    key: K,
    value: BriefingPersonalizationProfile[K],
  ) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function toggleTopic(option: PersonalizationTopicOption) {
    setPreferences((current) => {
      const idSet = new Set(current.followedTopicIds);
      const nameSet = new Set(current.followedTopicNames);
      const alreadyTracked = idSet.has(option.id) || nameSet.has(option.label);

      if (alreadyTracked) {
        idSet.delete(option.id);
        nameSet.delete(option.label);
      } else {
        idSet.add(option.id);
        nameSet.add(option.label);
      }

      return {
        ...current,
        followedTopicIds: [...idSet],
        followedTopicNames: [...nameSet],
      };
    });
  }

  function addEntity(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    setPreferences((current) => ({
      ...current,
      followedEntities: dedupeStrings([...current.followedEntities, trimmed]),
    }));
    setEntityInput("");
  }

  function removeEntity(value: string) {
    setPreferences((current) => ({
      ...current,
      followedEntities: current.followedEntities.filter(
        (entity) => entity.toLowerCase() !== value.toLowerCase(),
      ),
    }));
  }

  function savePreferences() {
    persistPersonalizationProfile(preferences);
    setSavedMessage(
      `Saved to this browser at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`,
    );
  }

  function resetPreferences() {
    setPreferences(defaultState);
    setEntityInput("");
    setSavedMessage("Reset to default settings. Save to apply the reset.");
  }

  const personalizationSummary = buildPersonalizationSummary(preferences);

  return (
    <Panel className="p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Personal settings
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
            Tune your personal briefing
          </h3>
          <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
            {signedIn
              ? "These controls shape which topics and entities pull harder in your ranked briefing without overriding the product’s quality gates."
              : "Sign in to apply these controls across your full briefing workflow. Preferences save in this browser for now."}
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
            onChange={(event) =>
              updatePreference("landingPage", event.target.value as BriefingPersonalizationProfile["landingPage"])
            }
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
            onChange={(event) =>
              updatePreference("readingDensity", event.target.value as BriefingPersonalizationProfile["readingDensity"])
            }
            className="w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm outline-none"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </label>

        <div className="rounded-[22px] border border-[var(--line)] bg-white/70 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Personalized ranking</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Keep objective event quality first, then shift the order toward your tracked priorities.
              </p>
            </div>
            <button
              type="button"
              aria-pressed={preferences.personalizationEnabled}
              onClick={() => updatePreference("personalizationEnabled", !preferences.personalizationEnabled)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                preferences.personalizationEnabled ? "bg-[var(--foreground)]" : "bg-[var(--line)]"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  preferences.personalizationEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

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

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[24px] border border-[var(--line)] bg-white/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Topic preferences
          </p>
          <h4 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Choose what should pull harder</h4>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Topics stay visible and editable here so the product feels like an intelligence briefing you can steer.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {availableTopics.map((topic) => {
              const selected =
                preferences.followedTopicIds.includes(topic.id) ||
                preferences.followedTopicNames.includes(topic.label);

              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                    selected
                      ? "border-[rgba(41,79,134,0.25)] bg-[rgba(41,79,134,0.10)] text-[#294f86]"
                      : "border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-[var(--panel)]"
                  }`}
                >
                  {selected ? "Tracking" : "Track"} {topic.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--line)] bg-white/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Briefing effect
          </p>
          <h4 className="mt-2 text-lg font-semibold text-[var(--foreground)]">What changes when this is on</h4>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            {personalizationSummary
              ? `${personalizationSummary}. Confirmed events can move higher when they match your priorities, but weak items still stay weak.`
              : "No topics or entities are active yet. Pick a few priorities to make the briefing feel tailored without becoming noisy."}
          </p>
          <div className="mt-4 space-y-2 rounded-[20px] border border-[var(--line)] bg-[var(--panel)]/45 p-4 text-sm leading-6 text-[var(--muted)]">
            <p>Confirmed multi-source events still dominate Top Events.</p>
            <p>Early Signals stay separated even when they match your interests.</p>
            <p>Visible ranking logic remains intact on every event card.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-[var(--line)] bg-white/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
          Followed entities
        </p>
        <h4 className="mt-2 text-lg font-semibold text-[var(--foreground)]">Add entities you want surfaced faster</h4>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Use this for companies, institutions, leaders, or products you actively watch.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={entityInput}
            onChange={(event) => setEntityInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addEntity(entityInput);
              }
            }}
            className="w-full rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3 text-sm outline-none"
            placeholder="Add an entity like Nvidia or Federal Reserve"
          />
          <Button type="button" onClick={() => addEntity(entityInput)} className="whitespace-nowrap">
            Add entity
          </Button>
        </div>

        {preferences.followedEntities.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {preferences.followedEntities.map((entity) => (
              <button
                key={entity}
                type="button"
                onClick={() => removeEntity(entity)}
                className="rounded-full border border-[rgba(41,79,134,0.18)] bg-[rgba(41,79,134,0.08)] px-3 py-2 text-sm text-[#294f86]"
              >
                {entity} ×
              </button>
            ))}
          </div>
        ) : null}

        {suggestedEntities.length ? (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Suggested from current briefing
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {suggestedEntities.map((entity) => (
                <button
                  key={entity}
                  type="button"
                  onClick={() => addEntity(entity)}
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--panel)]"
                >
                  Follow {entity}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={savePreferences}>
          Save preferences
        </Button>
        <Button type="button" variant="secondary" onClick={resetPreferences}>
          Reset
        </Button>
      </div>
    </Panel>
  );
}

function dedupeStrings(values: string[]) {
  return values.filter((value, index) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    return values.findIndex((candidate) => candidate.trim().toLowerCase() === normalized) === index;
  });
}
