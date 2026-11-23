import type {
  InterviewDateResponse,
  RecallDueResponse,
} from "@meritory/contracts";
import {
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
import { Button, buttonClass, linkClass } from "@/components/button";
import { CountSquares } from "@/components/count-squares";
import { LinkedNotice } from "@/components/linked-notice";
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
import { LocalDate, QueueNote, RecallButton } from "./home-parts";

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

function ChaptersCard({
  chapters,
  due,
}: {
  chapters: Chapters;
  /** Undefined while the counts load, so nothing shows a false 0 */
  due: RecallDueResponse | null | undefined;
}) {
  const tracks = [...new Set(chapters.map(({ track }) => track))];
  return (
    <section
      aria-labelledby="chapters-heading"
      className="flex flex-col gap-3 border border-border bg-card p-5"
    >
      <h2 id="chapters-heading" className="text-h3">
        Chapters
      </h2>
      {tracks.map((track) => (
        <div key={track.id} className="flex flex-col gap-3">
          <span className="text-small text-gold">{trackLabel(track)}</span>
          <ul className="flex flex-col gap-4">
            {chapters
              .filter((c) => c.track === track)
              .map(({ chapter }) => {
                const counts = due?.chapters.find(
                  (c) => c.trackId === track.id && c.chapterId === chapter.id,
                );
                const learned = counts?.learned ?? 0;
                const total = counts?.total ?? chapter.cards.length;
                return (
                  <li key={chapter.id} className="flex flex-col gap-2">
                    <span className="text-body font-semibold">
                      {chapter.title}
                    </span>
                    {due !== undefined && (
                      <>
                        <CountSquares filled={learned} total={total} />
                        <span className="text-small text-secondary">
                          {learned} of {plural(total, "card")} learned
                        </span>
                      </>
                    )}
                    <Link
                      href={chapterPath(track.id, chapter.id)}
                      className={`${linkClass} flex h-control items-center self-start`}
                    >
                      Read the chapter
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </section>
  );
}

/** What the counts say, worked out the same way for the header and the queue */
function homeState(due: RecallDueResponse | null, chapters: Chapters) {
  const rows = due ? queueRows(due, chapters) : [];
  const started = (due?.chapters.length ?? 0) > 0;
  return { rows, started, first: chapters[0] };
}

/** Start recall, Read the first chapter, or nothing, whichever the counts call for */
function HomeAction({ load, chapters }: { load: DueLoad; chapters: Chapters }) {
  const due = use(load);
  const { rows, started, first } = homeState(due, chapters);
  if (!due) return null;
  if (!started) {
    return first ? (
      <Link
        href={chapterPath(first.track.id, first.chapter.id)}
        className={`${buttonClass()} w-full sm:w-auto`}
      >
        Read {first.chapter.title}
      </Link>
    ) : null;
  }
  return rows.length > 0 ? <RecallButton /> : null;
}

function HomeBody({ load, chapters }: { load: DueLoad; chapters: Chapters }) {
  const due = use(load);
  const { rows, started } = homeState(due, chapters);
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
    return (
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-semibold">Nothing to recall yet</h2>
        <p className="text-small text-secondary">
          Start a chapter and its cards join recall, up to 10 new a day.
        </p>
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

/** Under Chapters while a date is coming up, linking to where it changes */
function InterviewLink({ load }: { load: InterviewLoad }) {
  const interview = use(load);
  if (!interview?.date) return null;
  if (interview.status !== "on" && interview.status !== "later") return null;
  return (
    <Link
      href="/account"
      className={`${linkClass} flex h-control items-center self-start`}
    >
      Interview on {dayName(interview.date)}
    </Link>
  );
}

/** Holds the queue's place while the counts load */
function QueueLoading() {
  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden="true" className="h-20 bg-sunken" />
      <p role="status" className="text-small text-secondary">
        Loading your cards
      </p>
    </div>
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
          <Suspense
            fallback={
              <Button waiting className="w-full sm:w-50">
                Start recall
              </Button>
            }
          >
            <HomeAction load={load} chapters={chapters} />
          </Suspense>
        </header>
        <LinkedNotice linked={linked} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <Suspense fallback={<QueueLoading />}>
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
