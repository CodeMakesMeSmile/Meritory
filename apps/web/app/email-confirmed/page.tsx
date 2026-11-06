import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { buttonClass, linkClass } from "@/components/button";
import { ExpiredLinkForm } from "./expired-link-form";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

// Every verification link lands here. The server adds ?error= when it fails.
export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { error } = await searchParams;
  return {
    title: `${error ? "This link expired" : "Email confirmed"} · Meritory`,
  };
}

export default async function EmailConfirmedPage({ searchParams }: PageProps) {
  const { error } = await searchParams;

  if (error) {
    return (
      <AuthShell>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-display">This link expired</h1>
            <p className="text-body text-secondary">
              Links work for 1 hour and only once. We can send you a fresh one.
            </p>
          </div>
          <ExpiredLinkForm />
          <Link href="/sign-in" className={`${linkClass} self-start`}>
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-display">Email confirmed</h1>
          <p className="text-body text-secondary">
            You're all set. Sign in to start practicing.
          </p>
        </div>
        <Link href="/sign-in" className={`${buttonClass()} w-full`}>
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}
