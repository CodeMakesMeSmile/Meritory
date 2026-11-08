import type { Metadata } from "next";
import Link from "next/link";
import { linkClass } from "@/components/button";
import { LogoLockup } from "@/components/logo";
import { requireMe } from "@/lib/me";
import { AccountCards } from "./account-cards";

export const metadata: Metadata = { title: "Account · Meritory" };

// TODO: MER-38 moves this into the app shell with the side navigation
export default async function AccountPage() {
  const me = await requireMe("/account");
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
        <AccountCards name={me.name} email={me.email} />
      </div>
    </main>
  );
}
