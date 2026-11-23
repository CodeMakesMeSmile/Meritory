import type { ContentResponse } from "@meritory/contracts";

export type Track = ContentResponse["tracks"][number];
export type Chapter = Track["chapters"][number];
export type Card = Chapter["cards"][number];
export type PromptCard = Extract<Card, { type: "prompt" }>;
export type PickOneCard = Extract<Card, { type: "pick-one" }>;
export type OrderingCard = Extract<Card, { type: "ordering" }>;
export type MatchingCard = Extract<Card, { type: "matching" }>;

/** A short name for tags, such as DSA */
export function trackLabel(track: Pick<Track, "id" | "title">): string {
  return track.id.length <= 4 ? track.id.toUpperCase() : track.title;
}

export function findChapter(
  content: ContentResponse,
  trackId: string,
  chapterId: string,
) {
  const track = content.tracks.find((t) => t.id === trackId);
  const chapter = track?.chapters.find((c) => c.id === chapterId);
  return track && chapter ? { track, chapter } : null;
}

/** Every chapter in track order, then chapter order */
export function allChapters(content: ContentResponse) {
  return content.tracks.flatMap((track) =>
    [...track.chapters]
      .sort((a, b) => a.order - b.order)
      .map((chapter) => ({ track, chapter })),
  );
}
