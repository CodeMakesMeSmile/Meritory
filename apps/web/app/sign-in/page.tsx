import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { nextPath } from "@/lib/next-path";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · Meritory" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  return (
    <AuthShell>
      <SignInForm next={nextPath(next)} />
    </AuthShell>
  );
}
