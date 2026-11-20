import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { linkClass } from "@/components/button";
import { Markdown, markdownHeadings } from "@/components/markdown";
import { chapterPath, findChapter, trackLabel } from "@/lib/content";
import { getContent, requireMe } from "@/lib/server-api";
import { StartRecallButton } from "./start-recall-button";

interface Props {
  params: Promise<{ trackId: string; chapterId: string }>;
}

async function load(params: Props["params"]) {
  const { trackId, chapterId } = await params;
  const path = chapterPath(trackId, chapterId);
  const content = await getContent(path);
  return { path, found: findChapter(content, trackId, chapterId) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { found } = await load(params);
  return { title: found ? `${found.chapter.title} · Meritory` : "Meritory" };
}

function plural(count: number, one: string) {
  return `${count} ${count === 1 ? one : `${one}s`}`;
}

export default async function ChapterPage({ params }: Props) {
  const { path, found } = await load(params);
  if (!found) notFound();
  const me = await requireMe(path);
  const { track, chapter } = found;
  const headings = markdownHeadings(chapter.explanation);
  const start = (
    <StartRecallButton
      trackId={track.id}
      chapterId={chapter.id}
      signInPath={path}
    />
  );

  return (
    <AppShell page="chapter" user={me}>
      <div className="mx-auto flex max-w-281 flex-col gap-6">
        <header className="flex flex-col gap-2">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-small text-secondary">
              <li>
                <Link href="/" className={linkClass}>
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gold">{trackLabel(track)}</li>
            </ol>
          </nav>
          <h1 className="text-display">{chapter.title}</h1>
          <p className="text-small text-secondary">
            {plural(chapter.cards.length, "card")},{" "}
            {plural(chapter.skills.length, "skill")}
          </p>
        </header>
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,42.5rem)_20rem]">
          <article className="flex min-w-0 flex-col gap-8 border border-border bg-card p-5 md:p-10">
            <Markdown text={chapter.explanation} />
            <div className="border-t border-border pt-6 sm:w-60">{start}</div>
          </article>
          <aside className="flex flex-col gap-4 lg:sticky lg:top-9">
            <div className="hidden lg:block">{start}</div>
            {headings.length > 0 && (
              <nav
                aria-labelledby="contents-heading"
                className="flex flex-col gap-3 border border-border bg-card p-5"
              >
                <h2 id="contents-heading" className="text-h3">
                  On this page
                </h2>
                <ul className="flex flex-col">
                  {headings.map((heading) => (
                    <li
                      key={heading.id}
                      className={heading.depth > 2 ? "pl-4" : undefined}
                    >
                      <a
                        href={`#${heading.id}`}
                        className={`${linkClass} flex min-h-control items-center`}
                      >
                        {heading.text}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="text-small text-secondary">
                  {plural(chapter.skills.length, "skill")}, each with a why or
                  when card. Recall starts with up to 10 new cards a day.
                </p>
              </nav>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
