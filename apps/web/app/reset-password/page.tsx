import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { linkClass } from "@/components/button";
import { ForgotPasswordForm } from "../forgot-password/forgot-password-form";
import { ResetPasswordForm } from "./reset-password-form";

interface PageProps {
  searchParams: Promise<{ token?: string | string[]; error?: string }>;
}

// Reset links land here with ?token=, or with ?error= when the link failed
async function linkToken({ searchParams }: PageProps) {
  const { token, error } = await searchParams;
  return !error && typeof token === "string" && token ? token : null;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const token = await linkToken(props);
  return {
    title: `${token ? "Choose a new password" : "This link expired"} · Meritory`,
  };
}

export default async function ResetPasswordPage(props: PageProps) {
  const token = await linkToken(props);

  if (!token) {
    return (
      <AuthShell>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="text-display">This link expired</h1>
            <p className="text-body text-secondary">
              Links work for 1 hour and only once. We can send you a fresh one.
            </p>
          </div>
          <ForgotPasswordForm submitLabel="Send a new link" />
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
          <h1 className="text-display">Choose a new password</h1>
          <p className="text-body text-secondary">
            Saving it signs you out on your other devices.
          </p>
        </div>
        <ResetPasswordForm token={token} />
      </div>
    </AuthShell>
  );
}
