const DAY_MS = 24 * 60 * 60 * 1000;

// Calendar days in the viewer's time zone, so 11pm yesterday is still yesterday
function daysBetween(earlier: Date, now: Date) {
  const start = new Date(earlier);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY_MS));
}

/** "today", "yesterday", or "3 days ago" */
export function daysAgo(date: Date, now = new Date()) {
  const days = daysBetween(date, now);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

/** Day precision, since the server only records activity once a day */
export function activeText(
  lastActive: Date,
  current: boolean,
  now = new Date(),
) {
  return current ? "Active now" : `Active ${daysAgo(lastActive, now)}`;
}

/** "signed in Nov 3", with the year when it isn't this one */
export function signedInText(signedIn: Date, now = new Date()) {
  const sameYear = signedIn.getFullYear() === now.getFullYear();
  const date = signedIn.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  return `signed in ${date}`;
}

/** "A", "A and B", or "A, B, and C" */
export function listNames(names: string[]) {
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
