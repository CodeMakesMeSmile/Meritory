import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/alert";
import { linkClass } from "@/components/button";
import { LinkedNotice } from "@/components/linked-notice";
import { LogoLockup } from "@/components/logo";
import { requireMe } from "@/lib/me";
import { providerNotice } from "@/lib/providers";
import { AccountCards } from "./account-cards";

export const metadata: Metadata = { title: "Account · Meritory" };

// TODO: MER-38 moves this into the app shell with the side navigation
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireMe("/account");
  const params = await searchParams;
  const notice = providerNotice(params.provider, params.error, "account");
  return (
    <main className="graph-paper min-h-screen px-4 py-12">
      <div className="mx-auto flex w-full max-w-180 flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <LogoLockup />
          <Link href="/" className={linkClass}>
            Home
          </Link>
        </div>
        <h1 className="text-display">Account</h1>
        {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
        <LinkedNotice linked={params.linked} />
        <AccountCards
          name={me.name}
          email={me.email}
          signInMethods={me.signInMethods}
          confirmed={params.confirmed === "1"}
        />
      </div>
    </main>
  );
}
