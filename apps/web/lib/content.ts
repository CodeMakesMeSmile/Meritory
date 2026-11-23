export {
  allChapters,
  type Card,
  type Chapter,
  findChapter,
  type MatchingCard,
  type OrderingCard,
  type PickOneCard,
  type PromptCard,
  type Track,
  trackLabel,
} from "@meritory/recall-client";

export function chapterPath(trackId: string, chapterId: string) {
  return `/tracks/${encodeURIComponent(trackId)}/chapters/${encodeURIComponent(chapterId)}`;
}

/** The date the way the page header shows it, such as Wednesday, November 18 */
export function longDate(now: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone,
  }).format(now);
}
