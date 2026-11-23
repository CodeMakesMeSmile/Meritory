import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { linkClass } from "@/components/button";
import { type ConfirmKind, failedUrl } from "@/lib/confirm-email";
import { ConfirmForm } from "./confirm-form";

export const metadata: Metadata = {
  title: "Confirm your email · Meritory",
  // The token is in this page's URL
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{
    token?: string | string[];
    change?: string | string[];
  }>;
}

const COPY: Record<ConfirmKind, { heading: string; text: string }> = {
  "sign-up": {
    heading: "Confirm your email",
    text: "Press Confirm email to finish setting up your account. If you didn't sign up for Meritory, you can ignore this page.",
  },
  change: {
    heading: "Confirm your new email",
    text: "Press Confirm email to switch your account to this address. If you didn't ask for this, you can ignore this page.",
  },
};

// Confirmation emails link here, and nothing is confirmed until the button is pressed
export default async function ConfirmEmailPage({ searchParams }: PageProps) {
  const { token, change } = await searchParams;
  const kind: ConfirmKind = change === "1" ? "change" : "sign-up";
  if (typeof token !== "string" || !token) redirect(failedUrl(kind));
  const { heading, text } = COPY[kind];

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-display">{heading}</h1>
          <p className="text-body text-secondary">{text}</p>
        </div>
        <ConfirmForm token={token} kind={kind} />
        <Link href="/sign-in" className={`${linkClass} self-start`}>
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
