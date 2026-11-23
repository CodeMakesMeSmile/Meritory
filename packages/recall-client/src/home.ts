import type { RecallDueResponse } from "@meritory/contracts";
import type { Chapter, Track } from "./content.ts";

export interface QueueRow {
  track: Track;
  chapter: Chapter;
  due: number;
  offered: number;
}

/** Chapters with something to do today, in book order */
export function queueRows(
  due: RecallDueResponse,
  chapters: readonly { track: Track; chapter: Chapter }[],
): QueueRow[] {
  return chapters.flatMap(({ track, chapter }) => {
    const counts = due.chapters.find(
      (c) => c.trackId === track.id && c.chapterId === chapter.id,
    );
    if (!counts) return [];
    return counts.due + counts.offered > 0
      ? [{ track, chapter, due: counts.due, offered: counts.offered }]
      : [];
  });
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

/** What a queue row holds, such as "3 to recall, 7 new" */
export function queueParts(row: Pick<QueueRow, "due" | "offered">): string {
  return [
    row.due > 0 ? `${row.due} to recall` : null,
    row.offered > 0 ? `${row.offered} new` : null,
  ]
    .filter(Boolean)
    .join(", ");
}

/** The line under Nothing due right now, with what tomorrow brings */
export function nothingDueLine(due: RecallDueResponse): string {
  const newLater = due.chapters.reduce((sum, c) => sum + c.new, 0);
  const tomorrow =
    due.dueTomorrow > 0
      ? ` ${due.dueTomorrow} come back tomorrow${newLater > 0 ? ", plus up to 10 new." : "."}`
      : newLater > 0
        ? " Up to 10 new cards arrive tomorrow."
        : "";
  return `You've done today's cards.${tomorrow}`;
}

/** The note under the queue. Cards waiting from an earlier day change what it says */
export function queueNote(due: RecallDueResponse): string {
  return due.overdue > 0
    ? "Due cards come first, oldest first. Do what you can today, and the rest stay in the queue."
    : "We add up to 10 new cards a day so reviews grow slowly.";
}
