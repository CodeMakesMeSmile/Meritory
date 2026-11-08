import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { linkClass } from "@/components/button";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset your password · Meritory" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-display">Reset your password</h1>
          <p className="text-body text-secondary">
            Enter your email and we'll send a link to choose a new password.
          </p>
        </div>
        <ForgotPasswordForm submitLabel="Send reset link" />
        <Link href="/sign-in" className={`${linkClass} self-start`}>
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
