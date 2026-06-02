import type { ScheduleEntry } from "./types";

export function parseSchedule(raw: unknown): ScheduleEntry[] {
  // Preferred shape: { times: ["08:00", ...] }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const times = (raw as { times?: unknown }).times;
    if (Array.isArray(times)) {
      return times
        .map((t) => ({ time: String(t) }))
        .filter((e) => /^\d{2}:\d{2}$/.test(e.time));
    }
  }
  // Legacy shape: [{ time: "08:00" }, ...]
  if (Array.isArray(raw)) {
    return raw
      .filter(
        (item): item is { time: unknown } =>
          typeof item === "object" && item !== null && "time" in item,
      )
      .map((item) => ({ time: String((item as { time: unknown }).time) }))
      .filter((e) => /^\d{2}:\d{2}$/.test(e.time));
  }
  return [];
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
