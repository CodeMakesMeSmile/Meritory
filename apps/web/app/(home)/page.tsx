import type { RecallDueResponse } from "@meritory/contracts";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { buttonClass, linkClass } from "@/components/button";
import { CountSquares } from "@/components/count-squares";
import { LinkedNotice } from "@/components/linked-notice";
import {
  allChapters,
  type Chapter,
  chapterPath,
  type Track,
  trackLabel,
} from "@/lib/content";
import { getContent, getDue, requireMe } from "@/lib/server-api";
import { LocalDate, QueueNote, RecallButton } from "./home-parts";

export const metadata: Metadata = { title: "Due for recall · Meritory" };

// TODO: MER-38 replaces this with the Today screen

/** Past this many due cards, the note says what happens to the rest */
const LOTS_DUE = 20;

interface QueueRow {
  track: Track;
  chapter: Chapter;
  due: number;
  offered: number;
}

/** New cards are offered chapter by chapter until today's allowance runs out */
function queueRows(
  due: RecallDueResponse,
  chapters: { track: Track; chapter: Chapter }[],
): QueueRow[] {
  let newLeft = due.newLeftToday;
  return chapters.flatMap(({ track, chapter }) => {
    const counts = due.chapters.find(
      (c) => c.trackId === track.id && c.chapterId === chapter.id,
    );
    if (!counts) return [];
    const offered = Math.min(counts.new, newLeft);
    newLeft -= offered;
    return counts.due + offered > 0
      ? [{ track, chapter, due: counts.due, offered }]
      : [];
  });
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function QueueItem({ row }: { row: QueueRow }) {
  const parts = [
    row.due > 0 ? `${row.due} to recall` : null,
    row.offered > 0 ? `${row.offered} new` : null,
  ].filter(Boolean);
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border border-border bg-card px-5 py-4">
      <div className="flex flex-col gap-1">
        <span className="text-body font-semibold">{row.chapter.title}</span>
        <span className="flex gap-3 text-small">
          <span className="text-gold">{trackLabel(row.track)}</span>
          <span className="text-secondary">{parts.join(", ")}</span>
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
  chapters: { track: Track; chapter: Chapter }[];
  due: RecallDueResponse | null;
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
                    <CountSquares filled={learned} total={total} />
                    <span className="text-small text-secondary">
                      {learned} of {plural(total, "card")} learned
                    </span>
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
  const due = await getDue("/").catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });
  const chapters = allChapters(content);
  const rows = due ? queueRows(due, chapters) : [];
  const started = (due?.chapters.length ?? 0) > 0;
  const first = chapters[0];
  const dueCount = rows.reduce((sum, row) => sum + row.due, 0);
  const newLater = (due?.chapters ?? []).reduce((sum, c) => sum + c.new, 0);

  let action = null;
  let body: React.ReactNode;
  if (!due) {
    body = (
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
  } else if (!started) {
    action = first ? (
      <Link
        href={chapterPath(first.track.id, first.chapter.id)}
        className={`${buttonClass()} w-full sm:w-auto`}
      >
        Read {first.chapter.title}
      </Link>
    ) : null;
    body = (
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-semibold">Nothing to recall yet</h2>
        <p className="text-small text-secondary">
          Start a chapter and its cards join recall, up to 10 new a day.
        </p>
      </div>
    );
  } else if (rows.length === 0) {
    const tomorrow =
      due.dueTomorrow > 0
        ? ` ${due.dueTomorrow} come back tomorrow${newLater > 0 ? ", plus up to 10 new." : "."}`
        : newLater > 0
          ? " Up to 10 new cards arrive tomorrow."
          : "";
    body = (
      <div className="flex flex-col gap-1">
        <h2 className="text-body font-semibold">Nothing due right now</h2>
        <p className="text-small text-secondary">
          You've done today's cards.{tomorrow}
        </p>
      </div>
    );
  } else {
    action = <RecallButton />;
    body = (
      <div className="flex flex-col gap-3">
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <QueueItem key={`${row.track.id}/${row.chapter.id}`} row={row} />
          ))}
        </ul>
        <QueueNote
          fallback={
            dueCount > LOTS_DUE
              ? "Due cards come first, oldest first. Do what you can today, and the rest stay in the queue."
              : "We add up to 10 new cards a day so reviews grow slowly."
          }
        />
      </div>
    );
  }

  return (
    <AppShell page="home" user={me}>
      <div className="mx-auto flex max-w-281 flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-display">Due for recall</h1>
            <LocalDate />
          </div>
          {action}
        </header>
        <LinkedNotice linked={linked} />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">{body}</div>
          <aside>
            <ChaptersCard chapters={chapters} due={due} />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
