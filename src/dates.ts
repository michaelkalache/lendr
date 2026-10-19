const DAY = 24 * 60 * 60 * 1000;

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const toISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const fromISODate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const sameDay = (a: Date, b: Date) => toISODate(a) === toISODate(b);

/** Number of calendar days covered, counting both the start and return day. */
export const daysInclusive = (start: Date, end: Date) =>
  Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / DAY) + 1;

export const formatDay = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

export const formatMonth = (date: Date) => date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

export function formatRange(startISO: string, endISO: string) {
  const start = fromISODate(startISO);
  const end = fromISODate(endISO);
  const startMonth = start.toLocaleDateString("en-US", { month: "short" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short" });
  if (sameDay(start, end)) return `${startMonth} ${start.getDate()}`;
  if (startMonth === endMonth) return `${startMonth} ${start.getDate()}–${end.getDate()}`;
  return `${startMonth} ${start.getDate()}–${endMonth} ${end.getDate()}`;
}

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export function formatWhen(iso: string) {
  const date = new Date(iso);
  const today = startOfDay(new Date());
  const that = startOfDay(date);
  const diff = Math.round((today.getTime() - that.getTime()) / DAY);
  if (diff === 0) return `Today at ${formatTime(iso)}`;
  if (diff === 1) return `Yesterday at ${formatTime(iso)}`;
  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${formatTime(iso)}`;
}
