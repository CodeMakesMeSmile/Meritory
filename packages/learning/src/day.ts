/** A recall day starts at this hour, so late-night study counts toward the same day */
export const DAY_STARTS_AT_HOUR = 4;

export const DEFAULT_TIME_ZONE = "UTC";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Whether the runtime knows this IANA time zone, under any of its names */
export function isKnownTimeZone(name: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: name });
    return true;
  } catch {
    return false;
  }
}

function localParts(time: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(time);
  const value = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

/** How far the time zone is ahead of UTC at this moment */
function offset(time: number, timeZone: string): number {
  const local = localParts(time, timeZone);
  const asUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  );
  return asUtc - Math.floor(time / 1000) * 1000;
}

/** When the learner's current recall day began, in their own time zone */
export function recallDayStart(
  now: Date,
  timeZone: string,
  startHour = DAY_STARTS_AT_HOUR,
): Date {
  const local = localParts(now.getTime(), timeZone);
  const dayOffset = local.hour < startHour ? -1 : 0;
  const wanted =
    Date.UTC(local.year, local.month - 1, local.day, startHour) +
    dayOffset * DAY;
  // Twice, so a clock change between the guess and the answer settles
  let time = wanted - offset(wanted, timeZone);
  time = wanted - offset(time, timeZone);
  return new Date(time);
}

/** When the recall day after the one starting at dayStart begins */
export function nextRecallDayStart(
  dayStart: Date,
  timeZone: string,
  startHour = DAY_STARTS_AT_HOUR,
): Date {
  // 36 hours on lands inside the next day, even across a clock change
  return recallDayStart(
    new Date(dayStart.getTime() + 36 * HOUR),
    timeZone,
    startHour,
  );
}
