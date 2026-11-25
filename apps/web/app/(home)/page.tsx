import type {
  InterviewDateResponse,
  RecallDueResponse,
} from "@meritory/contracts";
import {
  cappedLine,
  nothingDueLine,
  plural,
  type QueueRow,
  queueNote,
  queueParts,
  queueRows,
} from "@meritory/recall-client";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Suspense, use } from "react";
import { AppShell } from "@/components/app-shell";
import { buttonClass, linkClass } from "@/components/button";
import { CountSquares } from "@/components/count-squares";
import { LinkedNotice } from "@/components/linked-notice";
import { StepsLoader } from "@/components/steps-loader";
import {
  allChapters,
  type Chapter,
  chapterPath,
  type Track,
  trackLabel,
} from "@/lib/content";
import { dayName } from "@/lib/interview";
import {
  getContent,
  getDue,
  getInterviewDate,
  requireMe,
} from "@/lib/server-api";
import {
  LocalDate,
  MoreInProgress,
  QueueNote,
  RecallButton,
} from "./home-parts";

export const metadata: Metadata = { title: "Due for recall · Meritory" };

// TODO: MER-38 replaces this with the Today screen

type Chapters = { track: Track; chapter: Chapter }[];
type DueLoad = Promise<RecallDueResponse | null>;
type InterviewLoad = Promise<InterviewDateResponse | null>;

function QueueItem({ row }: { row: QueueRow }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card px-5 py-4">
      <div className="flex flex-col gap-1">
        <span className="text-body font-semibold">{row.chapter.title}</span>
        <span className="flex gap-3 text-small">
          <span className="text-gold">{trackLabel(row.track)}</span>
          <span className="text-secondary">{queueParts(row)}</span>
        </span>
      </div>
      <span className="flex items-center gap-4">
        <span className="flex items-center gap-1 border border-border px-1 font-mono text-tag">
          <span aria-hidden="true" className="hatch size-3" />
          DUE
        </span>
        <span className="font-mono text-small text-secondary">
          {plural(row.due + row.offered, "card")}
        </span>
      </span>
    </li>
  );
}

type Counts = RecallDueResponse["chapters"][number];

/** At most this many chapters in progress sit above the tracks */
const IN_PROGRESS_SHOWN = 4;

function countsFor(
  due: RecallDueResponse | null | undefined,
  track: Track,
  chapter: Chapter,
): Counts | undefined {
  return due?.chapters.find(
    (c) => c.trackId === track.id && c.chapterId === chapter.id,
  );
}

function trackDetailsId(track: Track) {
  return `track-${track.id}`;
}

/** A chapter link, with its learned cards as squares once it's started */
function ChapterRow({
  track,
  chapter,
  counts,
}: {
  track: Track;
  chapter: Chapter;
  counts: Counts | undefined;
}) {
  return (
    <li className={`flex flex-col ${counts ? "gap-2 pb-3" : ""}`}>
      <Link
        href={chapterPath(track.id, chapter.id)}
        className={`${linkClass} flex min-h-control items-center py-2`}
      >
        {chapter.title}
      </Link>
      {counts && (
        <>
          <CountSquares filled={counts.learned} total={counts.total} />
          <span className="text-small text-secondary">
            {counts.learned} of {plural(counts.total, "card")} learned
          </span>
        </>
      )}
    </li>
  );
}

function ChaptersCard({
  chapters,
  due,
}: {
  chapters: Chapters;
  /** Undefined while the counts load, so nothing shows a false 0 */
  due: RecallDueResponse | null | undefined;
}) {
  const tracks = [...new Set(chapters.map(({ track }) => track))];
  const inProgress = chapters.flatMap(({ track, chapter }) => {
    const counts = countsFor(due, track, chapter);
    return counts && counts.learned < counts.total
      ? [{ track, chapter, counts }]
      : [];
  });
  const shown = inProgress.slice(0, IN_PROGRESS_SHOWN);
  const rest = inProgress.slice(IN_PROGRESS_SHOWN);
  return (
    <section
      aria-labelledby="chapters-heading"
      className="flex flex-col border border-border bg-card p-5"
    >
      <h2 id="chapters-heading" className="mb-3 text-h3">
        Chapters
      </h2>
      {shown.length > 0 && (
        <div className="flex flex-col pb-2">
          <ul className="flex flex-col">
            {shown.map(({ track, chapter, counts }) => (
              <ChapterRow
                key={`${track.id}/${chapter.id}`}
                track={track}
                chapter={chapter}
                counts={counts}
              />
            ))}
          </ul>
          {rest.length > 0 && (
            <MoreInProgress
              count={rest.length}
              detailsIds={[
                ...new Set(rest.map(({ track }) => trackDetailsId(track))),
              ]}
            />
          )}
        </div>
      )}
      {tracks.map((track) => {
        const inTrack = chapters.filter((c) => c.track === track);
        return (
          <details key={track.id} id={trackDetailsId(track)} className="group">
            <summary className="focus-ring flex h-control cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
                className="shrink-0 text-primary group-open:rotate-90"
              >
                <path
                  d="M4 2 8 6 4 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              <span className="flex-1 text-small font-semibold text-gold">
                {trackLabel(track)}
              </span>
              <span className="text-small text-secondary">
                {plural(inTrack.length, "chapter")}
              </span>
            </summary>
            <ul className="flex flex-col pl-5">
              {inTrack.map(({ chapter }) => (
                <ChapterRow
                  key={chapter.id}
                  track={track}
                  chapter={chapter}
                  counts={countsFor(due, track, chapter)}
                />
              ))}
            </ul>
          </details>
        );
      })}
    </section>
  );
}

/** What the counts say, worked out the same way for the header and the queue */
function homeState(due: RecallDueResponse | null, chapters: Chapters) {
  const rows = due ? queueRows(due, chapters) : [];
  const started = (due?.chapters.length ?? 0) > 0;
  const next = chapters.find(
    ({ track, chapter }) => !countsFor(due, track, chapter),
  );
  return { rows, started, first: chapters[0], next };
}

/** Start recall when cards are due, since Start here holds the first chapter's button */
function HomeAction({ load, chapters }: { load: DueLoad; chapters: Chapters }) {
  const due = use(load);
  const { rows, started } = homeState(due, chapters);
  if (!due || !started) return null;
  return rows.length > 0 ? <RecallButton /> : null;
}

/** The first chapter for a new learner, with what it teaches */
function StartHere({
  track,
  chapter,
  newCardsPerDay,
}: {
  track: Track;
  chapter: Chapter;
  newCardsPerDay: number;
}) {
  return (
    <section
      aria-labelledby="start-heading"
      className="flex flex-col gap-4 border border-border bg-card p-6"
    >
      <div className="flex flex-col gap-2">
        <h2 id="start-heading" className="text-h2">
          Start with {chapter.title}
        </h2>
        <p className="flex gap-3 text-small">
          <span className="font-semibold text-gold">{trackLabel(track)}</span>
          <span className="text-secondary">
            {plural(chapter.cards.length, "card")}
          </span>
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <p>You'll learn to:</p>
        <ul className="flex list-disc flex-col gap-2 pl-6">
          {chapter.skills.map((skill) => (
            <li key={skill.id}>{skill.name}</li>
          ))}
        </ul>
      </div>
      <Link
        href={chapterPath(track.id, chapter.id)}
        className={`${buttonClass()} w-full sm:w-auto sm:min-w-50 sm:self-start`}
      >
        Read {chapter.title}
      </Link>
      <p className="text-small text-secondary">
        {newCardsPerDay > 0
          ? `Start a chapter and its cards join recall, up to ${newCardsPerDay} new a day.`
          : "Start a chapter and its cards join recall once new cards are back on in Settings."}
      </p>
    </section>
  );
}

/** The first chapter not started yet, offered under the queue */
function NextUp({ track, chapter }: { track: Track; chapter: Chapter }) {
  return (
    <section
      aria-labelledby="next-heading"
      className="flex flex-col gap-1 pt-5"
    >
      <h2 id="next-heading" className="pb-1 text-h3">
        Next up
      </h2>
      <span className="text-body font-semibold">{chapter.title}</span>
      <p className="flex gap-3 text-small">
        <span className="font-semibold text-gold">{trackLabel(track)}</span>
        <span className="text-secondary">
          {plural(chapter.cards.length, "card")}
        </span>
      </p>
      <Link
        href={chapterPath(track.id, chapter.id)}
        className={`${linkClass} flex h-control items-center self-start`}
      >
        Read {chapter.title}
      </Link>
    </section>
  );
}

function HomeBody({ load, chapters }: { load: DueLoad; chapters: Chapters }) {
  const due = use(load);
  const { rows, started, first, next } = homeState(due, chapters);
  if (!due) {
    return (
      <div role="alert" className="flex flex-col gap-3">
        <h2 className="text-body font-semibold">Your cards didn't load</h2>
        <p className="text-small text-secondary">
          Check your connection, then try again. Nothing you've done is lost.
        </p>
        <Link href="/" className={`${buttonClass("secondary")} self-start`}>
          Try again
        </Link>
      </div>
    );
  }
  if (!started) {
    if (!first) return null;
    return (
      <StartHere
        track={first.track}
        chapter={first.chapter}
        newCardsPerDay={due.newCardsPerDay}
      />
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <Queue due={due} rows={rows} />
      {next && <NextUp track={next.track} chapter={next.chapter} />}
    </div>
  );
}

/** Today's queue, or why it's empty */
function Queue({ due, rows }: { due: RecallDueResponse; rows: QueueRow[] }) {
  const capped = cappedLine(due);
  if (rows.length === 0 && capped) {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-semibold">Done for today</h2>
        <p className="text-small text-secondary">{capped}</p>
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-semibold">Nothing due right now</h2>
        <p className="text-small text-secondary">{nothingDueLine(due)}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <QueueItem key={`${row.track.id}/${row.chapter.id}`} row={row} />
        ))}
      </ul>
      <QueueNote fallback={queueNote(due)} />
    </div>
  );
}

function ChaptersWithCounts({
  load,
  chapters,
}: {
  load: DueLoad;
  chapters: Chapters;
}) {
  return <ChaptersCard chapters={chapters} due={use(load)} />;
}

/** Under Chapters while a date is coming up, linking to Settings where it changes */
function InterviewLink({ load }: { load: InterviewLoad }) {
  const interview = use(load);
  if (!interview?.date) return null;
  if (interview.status !== "on" && interview.status !== "later") return null;
  return (
    <Link
      href="/settings"
      className={`${linkClass} flex h-control items-center self-start`}
    >
      Interview on {dayName(interview.date)}
    </Link>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [me, content, { linked }] = await Promise.all([
    requireMe("/"),
    getContent("/"),
    searchParams,
  ]);
  const chapters = allChapters(content);
  // Not awaited, so the page shows while the counts load
  const load: DueLoad = getDue("/").catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });
  // The date is extra, so a failed read only hides its line
  const interview: InterviewLoad = getInterviewDate("/").catch(
    (error: unknown) => {
      unstable_rethrow(error);
      return null;
    },
  );

  return (
    <AppShell page="home" user={me}>
      <div className="mx-auto flex max-w-281 flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-display">Due for recall</h1>
            <LocalDate />
          </div>
          <Suspense fallback={null}>
            <HomeAction load={load} chapters={chapters} />
          </Suspense>
        </header>
        <LinkedNotice linked={linked} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <Suspense fallback={<StepsLoader label="Loading your cards" />}>
              <HomeBody load={load} chapters={chapters} />
            </Suspense>
          </div>
          <aside className="flex flex-col gap-4">
            <Suspense
              fallback={<ChaptersCard chapters={chapters} due={undefined} />}
            >
              <ChaptersWithCounts load={load} chapters={chapters} />
            </Suspense>
            <Suspense fallback={null}>
              <InterviewLink load={interview} />
            </Suspense>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
