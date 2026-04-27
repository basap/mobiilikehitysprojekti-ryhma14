import { Item, TimeSpentEntry } from "../todo/TodoItem";

export const rangeOptions = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All time", value: "all" },
] as const;

export type RangeValue = (typeof rangeOptions)[number]["value"];

export type ChartBar = {
  key: string;
  label: string;
  durationMs: number;
};

export function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function addMonths(date: Date, months: number) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

export function formatMinutes(durationMs: number) {
  const totalMinutes = Math.round(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours} h ${minutes} min`;
}

export function getRangeStart(range: RangeValue, now: Date) {
  const today = startOfDay(now);

  switch (range) {
    case "day":
      return today;
    case "week":
      return addDays(today, -6);
    case "month":
      return addDays(today, -29);
    case "year":
      return addMonths(today, -11);
    case "all":
      return null;
  }
}

export function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function filterEntriesByRange(entries: TimeSpentEntry[], range: RangeValue, now: Date) {
  return entries.filter((entry) => {
    if (range === "all") {
      return true;
    }

    const rangeStart = getRangeStart(range, now);

    if (!rangeStart) {
      return true;
    }

    const parsedDate = new Date(entry.date);
    return !Number.isNaN(parsedDate.getTime()) && startOfDay(parsedDate) >= rangeStart;
  });
}

export function buildDayBars(entries: TimeSpentEntry[], days: number, now: Date) {
  const totals = new Map<string, number>();

  entries.forEach((entry) => {
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.durationMs);
  });

  const startDate = addDays(startOfDay(now), -(days - 1));

  return Array.from({ length: days }, (_, index) => {
    const date = addDays(startDate, index);
    const key = getDateKey(date);
    return {
      key,
      label: date.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      durationMs: totals.get(key) ?? 0,
    };
  });
}

export function buildMonthBars(entries: TimeSpentEntry[], months: number, now: Date) {
  const totals = new Map<string, number>();

  entries.forEach((entry) => {
    const parsedDate = new Date(entry.date);

    if (Number.isNaN(parsedDate.getTime())) {
      return;
    }

    const key = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}`;
    totals.set(key, (totals.get(key) ?? 0) + entry.durationMs);
  });

  const bars: ChartBar[] = [];
  const startMonth = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  for (let index = 0; index < months; index += 1) {
    const date = new Date(startMonth.getFullYear(), startMonth.getMonth() + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    bars.push({
      key,
      label: date.toLocaleDateString("en-GB", { month: "short" }),
      durationMs: totals.get(key) ?? 0,
    });
  }

  return bars;
}

export function buildAllTimeBars(entries: TimeSpentEntry[]) {
  const totals = new Map<string, number>();

  entries.forEach((entry) => {
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.durationMs);
  });

  return [...totals.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, durationMs]) => ({
      key,
      label: new Date(key).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      durationMs,
    }));
}

export function buildTaskTotals(items: Item[], range: RangeValue, now: Date) {
  return items
    .map((item) => ({
      id: item.id,
      name: item.name,
      durationMs: filterEntriesByRange(item.timeSpentEntries, range, now).reduce(
        (sum, entry) => sum + entry.durationMs,
        0
      ),
    }))
    .filter((item) => item.durationMs > 0)
    .sort((a, b) => b.durationMs - a.durationMs);
}
