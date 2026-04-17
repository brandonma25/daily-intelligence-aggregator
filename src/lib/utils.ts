import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBriefingDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const todayUtc = new Date().toISOString().slice(0, 10);
  const valueUtc = date.toISOString().slice(0, 10);
  const formatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return valueUtc === todayUtc
    ? `Today • ${formatted.replace(/, (\d{4})$/, "")}`
    : formatted;
}

export function stripHtml(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function firstSentence(value: string, fallback: string) {
  const clean = stripHtml(value);
  const [sentence] = clean.split(/(?<=[.!?])\s+/);
  return sentence?.trim() || fallback;
}

export function minutesToLabel(minutes: number) {
  return `${minutes} min`;
}
