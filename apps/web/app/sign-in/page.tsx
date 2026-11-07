import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { nextPath } from "@/lib/next-path";
import {
  PASSWORD_SAVED_PARAM,
  PASSWORD_SAVED_VALUE,
} from "@/lib/password-saved";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Meritory" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <AuthShell>
      <SignInForm
        next={nextPath(params.next)}
        passwordSaved={params[PASSWORD_SAVED_PARAM] === PASSWORD_SAVED_VALUE}
      />
    </AuthShell>
  );
}
