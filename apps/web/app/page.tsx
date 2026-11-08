import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { linkClass } from "@/components/button";
import { requireMe } from "@/lib/me";
import { SignOutButton } from "./sign-out-button";

// TODO: MER-38 replaces this with the Today screen
export default async function Home() {
  const me = await requireMe("/");
  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-display">Signed in as {me.name}</h1>
          <p className="text-body text-secondary">
            Your Today screen is on its way.
          </p>
        </div>
        <SignOutButton />
        <Link href="/account" className={`${linkClass} self-start`}>
          Account
        </Link>
      </div>
    </AuthShell>
  );
}
