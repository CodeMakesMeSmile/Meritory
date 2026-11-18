import path from "node:path";
import type { Card } from "./card.ts";
import { checkChapterCards, loadCards } from "./cards.ts";
import { ChapterFile, TrackFile } from "./chapter.ts";
import {
  type LoadedExercise,
  loadExercises,
  type TrackIds,
} from "./exercises.ts";
import { checkExplanation } from "./explanation.ts";
import {
  type Problem,
  readText,
  readYamlFile,
  subfolders,
} from "./yaml-file.ts";

/** A chapter with its explanation, its cards, and where it's written */
export type LoadedChapter = ChapterFile & {
  track: string;
  explanation: string;
  cards: Card[];
  exercises: LoadedExercise[];
  file: string;
};

export type TrackChapters = {
  track: TrackFile | undefined;
  chapters: LoadedChapter[];
  problems: Problem[];
};

/**
 * Reads a track's `track.yaml` and every folder in `chapters/`, with each
 * chapter's explanation, cards, and exercises, and reports each problem with
 * its file and line. A track with no chapters folder has no chapters.
 */
export async function loadTrackChapters(
  trackDir: string,
): Promise<TrackChapters> {
  const problems: Problem[] = [];
  const chapters: LoadedChapter[] = [];
  const chaptersDir = path.join(trackDir, "chapters");
  const folders = await subfolders(chaptersDir);
  if (folders.length === 0) return { track: undefined, chapters, problems };

  const trackFile = path.join(trackDir, "track.yaml");
  const trackRead = await readYamlFile<TrackFile>(
    TrackFile,
    trackFile,
    problems,
  );
  if (!trackRead) {
    problems.push({
      file: trackFile,
      line: null,
      message: "is missing, so the chapters have no track",
    });
  }
  const track = trackRead?.value;
  if (trackRead && track && track.id !== path.basename(trackDir)) {
    problems.push({
      file: trackFile,
      line: trackRead.parsed.lineAt("/id"),
      message: `id ${track.id} must match its folder name, ${path.basename(trackDir)}`,
    });
  }

  const lines = new Map<string, (pointer: string) => number | null>();
  const cardChapter = new Map<string, string>();
  const ids: TrackIds = { exercises: new Map(), cases: new Map() };
  for (const folder of folders) {
    const dir = path.join(chaptersDir, folder);
    const file = path.join(dir, "chapter.yaml");
    const read = await readYamlFile<ChapterFile>(ChapterFile, file, problems);
    if (!read) {
      problems.push({ file, line: null, message: "is missing" });
      continue;
    }

    const explanationFile = path.join(dir, "explanation.md");
    const explanation = await readText(explanationFile);
    if (explanation === undefined) {
      problems.push({
        file: explanationFile,
        line: null,
        message: "is missing",
      });
    } else {
      checkExplanation(explanationFile, explanation, problems);
    }

    const cardsFile = path.join(dir, "cards.yaml");
    const cards = await loadCards(cardsFile, problems);
    if (!cards) {
      problems.push({ file: cardsFile, line: null, message: "is missing" });
    }

    const chapter = read.value;
    if (!chapter) continue;
    if (chapter.id !== folder) {
      problems.push({
        file,
        line: read.parsed.lineAt("/id"),
        message: `id ${chapter.id} must match its folder name, ${folder}`,
      });
    }
    if (cards) {
      checkChapterCards(cardsFile, chapter, cards, problems);
      for (const { card, index } of cards.cards) {
        const owner = cardChapter.get(card.id);
        if (owner !== undefined) {
          problems.push({
            file: cardsFile,
            line: cards.lineAt(`/${index}/id`),
            message: `card ${card.id} is also in ${owner}`,
          });
        } else {
          cardChapter.set(card.id, chapter.id);
        }
      }
    }
    const exercises = await loadExercises(dir, chapter, ids, problems);
    lines.set(file, read.parsed.lineAt);
    chapters.push({
      ...chapter,
      track: track?.id ?? path.basename(trackDir),
      explanation: explanation ?? "",
      cards: cards?.cards.map(({ card }) => card) ?? [],
      exercises,
      file,
    });
  }

  checkAcrossChapters(chapters, lines, problems);
  chapters.sort((a, b) => a.order - b.order);
  return { track, chapters, problems };
}

function checkAcrossChapters(
  chapters: LoadedChapter[],
  lines: Map<string, (pointer: string) => number | null>,
  problems: Problem[],
) {
  const at = (chapter: LoadedChapter, pointer: string) =>
    lines.get(chapter.file)?.(pointer) ?? null;
  const byId = new Map<string, LoadedChapter>();
  const byOrder = new Map<number, LoadedChapter>();
  const skillChapter = new Map<string, string>();

  for (const chapter of chapters) {
    const sameId = byId.get(chapter.id);
    if (sameId) {
      problems.push({
        file: chapter.file,
        line: at(chapter, "/id"),
        message: `chapter ${chapter.id} is used by another chapter`,
      });
    } else {
      byId.set(chapter.id, chapter);
    }

    const sameOrder = byOrder.get(chapter.order);
    if (sameOrder) {
      problems.push({
        file: chapter.file,
        line: at(chapter, "/order"),
        message: `order ${chapter.order} is also used by ${sameOrder.id}`,
      });
    } else {
      byOrder.set(chapter.order, chapter);
    }

    chapter.skills.forEach((skill, index) => {
      const owner = skillChapter.get(skill.id);
      if (owner !== undefined) {
        problems.push({
          file: chapter.file,
          line: at(chapter, `/skills/${index}/id`),
          message: `skill ${skill.id} is also in ${owner}`,
        });
      } else {
        skillChapter.set(skill.id, chapter.id);
      }
    });
  }

  for (const chapter of chapters) {
    (chapter.prerequisites ?? []).forEach((id, index) => {
      const line = at(chapter, `/prerequisites/${index}`);
      if (id === chapter.id) {
        problems.push({
          file: chapter.file,
          line,
          message: "a chapter can't be its own prerequisite",
        });
      } else if (!byId.has(id)) {
        problems.push({
          file: chapter.file,
          line,
          message: `prerequisite ${id} is not a chapter in this track`,
        });
      }
    });
  }

  for (const chapter of chapters) {
    const loop = findLoop(chapter.id, byId);
    // Reported once, by the chapter that sorts first in the loop
    if (loop && loop[0] === [...loop].sort()[0]) {
      problems.push({
        file: chapter.file,
        line: at(chapter, "/prerequisites"),
        message: `prerequisites go in a circle: ${[...loop, loop[0]].join(" -> ")}`,
      });
    }
  }
}

// Follows prerequisites from one chapter and returns the loop it's part of
function findLoop(
  start: string,
  byId: Map<string, LoadedChapter>,
): string[] | undefined {
  const walk = (id: string, trail: string[]): string[] | undefined => {
    for (const next of byId.get(id)?.prerequisites ?? []) {
      // A chapter listing itself is reported on its own
      if (next === start) {
        if (trail.length > 1) return trail;
        continue;
      }
      if (trail.includes(next) || !byId.has(next)) continue;
      const loop = walk(next, [...trail, next]);
      if (loop) return loop;
    }
    return undefined;
  };
  return walk(start, [start]);
}
