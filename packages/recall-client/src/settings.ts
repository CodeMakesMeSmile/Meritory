import type { LearnerSettingsValues } from "@meritory/contracts";

// Words the web and phone Settings screens share, so both say the same thing

export const SETTINGS_DESCRIPTION =
  "Each setting shows the value we suggest. Change the ones that don't fit how you study.";

export const SAVE_FAILED =
  "That didn't save. Check your connection, then try Save changes again. Your changes are still here.";

export const SAVE_OFFLINE = "You're offline. Saving needs a connection.";

export const RESET_DONE = "Done. Every setting is back to its suggested value.";

export const RESET_DESCRIPTION =
  "Puts every setting above back to its suggested value. Your progress, interview date, and account stay as they are.";

/** Above this band reviews climb fast, and below it forgetting adds work */
const NOTE_BAND = { low: 80, high: 95 };

/** Midnight, 1:00 a.m., and on through 11:00 p.m. */
export function hourLabel(hour: number): string {
  if (hour === 0) return "Midnight";
  if (hour === 12) return "Noon";
  return hour < 12 ? `${hour}:00 a.m.` : `${hour - 12}:00 p.m.`;
}

export const DAY_START_HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** About how many reviews a day a steady new-card rate settles into, from Anki's 20 new giving about 200 */
export const settledReviews = (newCards: number) => newCards * 10;

export function newCardsHelp(value: number, suggested: number): string {
  if (value === 0) {
    return `Suggested: ${suggested}. At 0, no new cards come in, and only due cards come up.`;
  }
  return `Suggested: ${suggested}. At ${value}, expect around ${settledReviews(value)} reviews a day once you've settled in.`;
}

export function recallTargetHelp(value: number, suggested: number): string {
  if (value < NOTE_BAND.low) {
    return `Suggested: ${suggested}%. At ${value}%, you'll forget more between reviews, and relearning them adds work.`;
  }
  if (value > NOTE_BAND.high) {
    return `Suggested: ${suggested}%. At ${value}%, cards come back much sooner, and reviews climb fast.`;
  }
  return `Suggested: ${suggested}%. Higher means cards come back sooner, with more reviews each day.`;
}

/** A label as the end of a sentence, without doubling the period of a.m. or p.m. */
const sentence = (label: string) => (label.endsWith(".") ? label : `${label}.`);

export const dayStartHelp = (suggested: number) =>
  `Suggested: ${sentence(hourLabel(suggested))} Study before then counts toward the day before.`;

export function trackLimitsLine(
  limits: Record<string, number>,
  newCards: number,
): string {
  const count = Object.keys(limits).length;
  if (count === 0) {
    return `None set. Every track draws from the ${newCards} above.`;
  }
  return `Set for ${count === 1 ? "1 track" : `${count} tracks`}. Each comes out of the ${newCards} a day.`;
}

export const trackLimitsHelp = (newCards: number) =>
  `Each limit comes out of the ${newCards} a day. Leave one empty for no limit.`;

/** Under a track limit of 0, with the track named as a reader would say it */
export const pausedTrackLine = (trackName: string) =>
  `Paused. No new ${trackName.toLowerCase()} cards until you change this.`;

export function reviewsCapLine(cap: number | null): string {
  return cap === null
    ? "No cap. Every card that's due shows up."
    : `Up to ${cap} a day. The rest wait for tomorrow.`;
}

export const REVIEWS_CAP_HELP =
  "Suggested: no cap. When you reach it, new cards stop for the day and the rest wait for tomorrow.";

/** Where the time zone came from, with the device named as the screen calls it */
export function timeZoneLine(
  zone: string,
  followsDevice: boolean,
  device: "device" | "phone",
): string {
  return followsDevice
    ? `${zone}, from this ${device}`
    : `${zone}, picked by you`;
}

export const interviewTargetHelp = (suggested: number) =>
  `Suggested: ${suggested}%. At least your everyday target.`;

export const interviewWeeksHelp = (suggested: number) =>
  `Suggested: ${suggested} weeks. From 1 to 8.`;

export const rehearsalHelp = (
  suggested: LearnerSettingsValues["rehearsalMinutes"],
) =>
  `Suggested: ${suggested.designReview}, ${suggested.classDesign}, and ${suggested.storyAnswer} minutes. Match the round you're preparing for.`;

/** What a saved Daily recall card means from today on */
export const dailySavedLine = (newCards: number) =>
  newCards === 0
    ? "Saved. New cards are paused, starting today."
    : `Saved. You'll get up to ${newCards} new cards a day, starting today.`;

export const PRACTICE_SAVED = "Saved. Your next exercise uses these.";

/** Fields keep digits only, so a number is all that can be typed */
export const digitsOnly = (text: string) => text.replace(/\D/g, "").slice(0, 3);

export const ENTER_A_NUMBER = "Enter a number.";

/** A whole number typed into a field, or null when it's empty */
export function wholeNumber(text: string): number | null {
  return /^\d{1,3}$/.test(text) ? Number(text) : null;
}
