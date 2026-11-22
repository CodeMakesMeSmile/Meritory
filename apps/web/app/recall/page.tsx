import type { Metadata } from "next";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/button";
import { KeepSession } from "@/components/keep-session";
import { TimeZoneSync } from "@/components/time-zone-sync";
import { sittingCards } from "@/lib/recall-sitting";
import { getContent, getDue, getSession, requireMe } from "@/lib/server-api";
import { Sitting } from "./sitting";

export const metadata: Metadata = { title: "Recall · Meritory" };

const PATH = "/recall";

function Message({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action: ReactNode;
}) {
  return (
    <>
      <div className="flex flex-col gap-2 border border-accent bg-card p-5 md:p-8">
        <h1 className="text-h2">{title}</h1>
        <p className="text-secondary">{text}</p>
      </div>
      <div className="flex justify-end">{action}</div>
    </>
  );
}

/** A recall sitting, without the rail so the card has the page */
export default async function RecallPage() {
  const [me, content] = await Promise.all([requireMe(PATH), getContent(PATH)]);
  const session = await getSession(PATH).catch((error: unknown) => {
    unstable_rethrow(error);
    return null;
  });
  const items = session ? sittingCards(content, session) : [];
  const home = (
    <Link href="/" className={`${buttonClass()} w-full sm:w-50`}>
      Back to Home
    </Link>
  );

  let body: ReactNode;
  if (!session) {
    body = (
      <Message
        title="Your cards didn't load"
        text="Check your connection, then try again. Nothing you've done is lost."
        action={
          <Link href={PATH} className={`${buttonClass()} w-full sm:w-50`}>
            Try again
          </Link>
        }
      />
    );
  } else if (items.length === 0) {
    // Only asked when nothing is due, to tell a finished day from one not started
    const due = await getDue(PATH).catch((error: unknown) => {
      unstable_rethrow(error);
      return null;
    });
    body =
      due && due.chapters.length === 0 ? (
        <Message
          title="Nothing to recall yet"
          text="Start a chapter and its cards join recall, up to 10 new a day."
          action={home}
        />
      ) : (
        <Message
          title="Nothing due right now"
          text="You've done today's cards. Your next ones show up on Home."
          action={home}
        />
      );
  } else {
    body = <Sitting items={items} now={new Date().toISOString()} />;
  }

  return (
    <main className="graph-paper min-h-screen px-4 py-8 md:py-10">
      <KeepSession />
      <TimeZoneSync timeZone={me.timeZone} />
      <div className="mx-auto flex max-w-180 flex-col gap-5">{body}</div>
    </main>
  );
}
