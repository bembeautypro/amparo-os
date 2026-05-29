import type { ScheduleEntry } from "./types";

export function parseSchedule(raw: unknown): ScheduleEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is { time: unknown } =>
        typeof item === "object" && item !== null && "time" in item,
    )
    .map((item) => ({ time: String((item as { time: unknown }).time) }))
    .filter((e) => /^\d{2}:\d{2}$/.test(e.time));
}

export function formatTime(hhmm: string) {
  return hhmm;
}

/** Returns the scheduled_for ISO for a given HH:MM today */
export function scheduledForToday(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(h ?? 0, m ?? 0, 0, 0);
  return d;
}

/** Returns the next dose HH:MM for today not yet taken, or null */
export function nextDoseToday(
  schedule: ScheduleEntry[],
  takenTimes: string[],
): string | null {
  const now = new Date();
  const sorted = [...schedule].sort((a, b) => a.time.localeCompare(b.time));
  for (const entry of sorted) {
    if (takenTimes.includes(entry.time)) continue;
    const d = scheduledForToday(entry.time);
    // Allow checking until end of day
    if (d.getDate() === now.getDate()) return entry.time;
  }
  return null;
}
