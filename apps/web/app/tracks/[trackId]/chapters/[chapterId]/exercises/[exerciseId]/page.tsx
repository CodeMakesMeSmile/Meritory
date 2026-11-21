import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { linkClass } from "@/components/button";
import { Markdown } from "@/components/markdown";
import { chapterPath, findChapter, trackLabel } from "@/lib/content";
import { exercisePath, findExercise } from "@/lib/practice";
import { getContent, requireMe } from "@/lib/server-api";
import { CodePractice } from "./code-practice";
import { DesignPractice } from "./design-practice";

interface Props {
  params: Promise<{ trackId: string; chapterId: string; exerciseId: string }>;
}

async function load(params: Props["params"]) {
  const { trackId, chapterId, exerciseId } = await params;
  const path = exercisePath(trackId, chapterId, exerciseId);
  const content = await getContent(path);
  const found = findChapter(content, trackId, chapterId);
  const practice = found
    ? findExercise(found.track, found.chapter, exerciseId)
    : null;
  return { path, found: found && practice ? { ...found, ...practice } : null };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { found } = await load(params);
  return { title: found ? `${found.exercise.title} · Meritory` : "Meritory" };
}

const DIFFICULTY = { easy: "Easy", medium: "Medium", hard: "Hard" } as const;

export default async function ExercisePage({ params }: Props) {
  const { path, found } = await load(params);
  if (!found) notFound();
  const me = await requireMe(path);
  const { track, chapter, exercise, rubric } = found;

  return (
    <AppShell page="chapter" user={me}>
      <div className="mx-auto flex max-w-170 flex-col gap-8">
        <header className="flex flex-col gap-2">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-small text-secondary">
              <li>
                <Link
                  href="/"
                  className={`${linkClass} flex h-control items-center`}
                >
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gold">{trackLabel(track)}</li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={chapterPath(track.id, chapter.id)}
                  className={`${linkClass} flex h-control items-center`}
                >
                  {chapter.title}
                </Link>
              </li>
            </ol>
          </nav>
          <h1 className="text-display">{exercise.title}</h1>
          <p className="text-small text-secondary">
            {exercise.kind === "design" ? "Written answer" : "Coding"},{" "}
            {DIFFICULTY[exercise.difficulty].toLowerCase()}
          </p>
        </header>
        <article className="border border-border bg-card p-5 md:p-8">
          <Markdown text={exercise.statement} />
        </article>
        {exercise.kind === "design" && rubric ? (
          <DesignPractice
            trackId={track.id}
            exerciseId={exercise.id}
            version={exercise.version}
            rubric={rubric}
            requires={exercise.requires ?? []}
            answer={exercise.answer}
          />
        ) : exercise.kind === "coding" ? (
          <CodePractice
            trackId={track.id}
            chapterId={chapter.id}
            exerciseId={exercise.id}
            signature={exercise.signature}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
