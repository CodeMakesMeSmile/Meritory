import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create your account · Meritory" };

export default function SignUpPage() {
  return (
    <AuthShell note="A few fields and you're in.">
      <SignUpForm />
    </AuthShell>
  );
}
