export const daysPerWeek = 7;

export function isSameMonth(relative: Date, current: Date) {
  return relative.getMonth() === current.getMonth()
    && relative.getFullYear() === current.getFullYear();
}

export function isPrevMonth(relative: Date, current: Date) {
  return (
    relative.getMonth() < current.getMonth()
    && relative.getFullYear() === current.getFullYear()
  ) || (
    relative.getFullYear() < current.getFullYear()
  );
}

export function isNextMonth(relative: Date, current: Date) {
  return (
    relative.getMonth() > current.getMonth()
    && relative.getFullYear() === current.getFullYear()
  ) || (
    relative.getFullYear() > current.getFullYear()
  );
}

export function isBetween(origin?: Date | null, start?: Date | null, end?: Date | null) {
  return (
    isGreater(origin, start) && isGreater(end, origin)
  ) || (
    isGreater(start, origin) && isGreater(origin, end)
  );
}

export function isEqual(origin?: Date | null, date?: Date | null) {
  return !!date && !!origin
    && origin.getDate() === date.getDate()
    && isSameMonth(origin, date);
}

export function isGreater(origin?: Date | null, date?: Date | null) {
  return !!date && !!origin && (
      (origin.getDate() > date.getDate() && isSameMonth(origin, date))
      || isNextMonth(origin, date)
    );
}

export function isSmaller(origin: Date, date?: Date | null) {
  return !!date && (
      (origin.getDate() < date.getDate() && isSameMonth(origin, date))
      || isPrevMonth(origin, date)
    );
}

export function withOffset(origin: Date, offset?: {
  days?: number;
  months?: number;
  years?: number
}) {
  return !offset ? origin : new Date(
    origin.getFullYear() + (offset.years ?? 0),
    origin.getMonth() + (offset.months ?? 0),
    origin.getDate() + (offset.days ?? 0),
  );
}

export function getDisplayDate(offsetDays: number, origin: Date) {
  return offsetDays === 0 ? origin : withOffset(origin, { days: offsetDays });
}

export function getNearestWeekStart(weekStartDay: number, origin: Date) {
  return getDisplayDate(0 - normalizeWeekDay(weekStartDay, origin.getDay()), origin);
}

export function normalizeWeekDay(weekStartDay: number, weekDay: number): number {
  return (weekDay - weekStartDay + 7) % 7;
}

export function getNearestMonthStart(origin: Date) {
  return getDisplayDate(1 - origin.getDate(), origin);
}

export function getDayOffsetFromWeekOffset(day: number, weekOffset: number) {
  return day + (weekOffset * daysPerWeek);
}

export const getWeeksSinceUnix = (weekStartDay: () => number) => (origin: Date) => {
  const daysSince = Math.floor(origin.getTime() / (1000 * 60 * 60 * 24));

  return Math.floor((daysSince + 5 - weekStartDay()) / 7);
};
