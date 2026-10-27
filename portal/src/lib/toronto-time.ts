export const TORONTO_TZ = "America/Toronto";

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  let hour = Number(map.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour,
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function offsetMs(date: Date, timeZone: string): number {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - date.getTime();
}

/** UTC instant of a wall-clock time in `timeZone`. Day and month overflow. */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const firstOffset = offsetMs(guess, timeZone);
  const corrected = new Date(guess.getTime() - firstOffset);
  const secondOffset = offsetMs(corrected, timeZone);
  if (secondOffset !== firstOffset) {
    return new Date(guess.getTime() - secondOffset);
  }
  return corrected;
}

export type TorontoWindows = {
  todayStart: Date;
  todayEnd: Date;
  monthStart: Date;
  monthEnd: Date;
  hour: number;
};

/**
 * Inclusive start, exclusive end, for "today" and "this month" in America/Toronto.
 * `monthEnd` is midnight at the start of next month, so filters use `lt`, not `lte`.
 */
export function torontoWindows(now: Date): TorontoWindows {
  const parts = zonedParts(now, TORONTO_TZ);
  return {
    todayStart: zonedTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, TORONTO_TZ),
    todayEnd: zonedTimeToUtc(parts.year, parts.month, parts.day + 1, 0, 0, 0, TORONTO_TZ),
    monthStart: zonedTimeToUtc(parts.year, parts.month, 1, 0, 0, 0, TORONTO_TZ),
    monthEnd: zonedTimeToUtc(parts.year, parts.month + 1, 1, 0, 0, 0, TORONTO_TZ),
    hour: parts.hour,
  };
}
