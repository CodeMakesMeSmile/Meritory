import { providerNotice } from "@meritory/contracts/sign-in-messages";
import type { Metadata } from "next";
import Link from "next/link";
import { linkClass } from "@/components/button";
import { KeepSession } from "@/components/keep-session";
import { LinkedNotice } from "@/components/linked-notice";
import { LogoLockup } from "@/components/logo";
import { emailStep } from "@/lib/email-change";
import { requireMe } from "@/lib/me";
import { AccountCards } from "./account-cards";

export const metadata: Metadata = { title: "Account · Meritory" };

// TODO: MER-38 moves this into the app shell with the side navigation
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const step = emailStep(params.email, params.error);
  // An emailed link may open where nobody is signed in, so the step survives sign-in
  const me = await requireMe(step ? `/account?email=${step}` : "/account");
  const notice = providerNotice(
    params.provider,
    params.error,
    "account",
    me.email,
  );
  return (
    <main className="graph-paper min-h-screen px-4 py-12">
      <KeepSession />
      <div className="mx-auto flex w-full max-w-180 flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <LogoLockup />
          <Link href="/" className={linkClass}>
            Home
          </Link>
        </div>
        <h1 className="text-display">Account</h1>
        <LinkedNotice linked={params.linked} />
        <AccountCards
          name={me.name}
          email={me.email}
          signInMethods={me.signInMethods}
          notice={notice}
          confirmed={params.confirmed === "1"}
          emailStep={step}
        />
      </div>
    </main>
  );
}
