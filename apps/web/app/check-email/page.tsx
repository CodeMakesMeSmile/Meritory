import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { linkClass } from "@/components/button";
import { SentTo } from "./sent-to";

export const metadata: Metadata = { title: "Check your email · Meritory" };

export default function CheckEmailPage() {
  return (
    <AuthShell note={"You can close this tab.\nThe link works on any device."}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-display">Check your email</h1>
          <SentTo />
        </div>
        <p className="text-small text-secondary">
          No email after a few minutes? Check your spam folder.
        </p>
        <div className="flex gap-5">
          <Link href="/sign-up" className={linkClass}>
            Use a different email
          </Link>
          <Link href="/sign-in" className={linkClass}>
            Back to sign in
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
