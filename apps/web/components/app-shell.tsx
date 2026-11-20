import Link from "next/link";
import type { ReactNode } from "react";
import { SignOutButton } from "@/app/sign-out-button";
import { KeepSession } from "./keep-session";
import { LogoLockup } from "./logo";
import { TimeZoneSync } from "./time-zone-sync";

type Page = "home" | "chapter";

function NavItem({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`focus-ring flex h-control items-center rounded-control px-3 text-body ${
        current ? "bg-accent text-on-accent" : "text-primary hover:bg-sunken"
      }`}
    >
      {children}
    </Link>
  );
}

/** The rail beside every signed-in page that isn't a recall sitting */
export function AppShell({
  page,
  user,
  children,
}: {
  page: Page;
  user: { id: string; name: string };
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <KeepSession />
      <TimeZoneSync userId={user.id} />
      <nav
        aria-label="Main"
        className="flex flex-wrap items-center gap-x-2 gap-y-3 bg-rail px-4 py-3 md:sticky md:top-0 md:h-screen md:w-59 md:shrink-0 md:flex-col md:flex-nowrap md:items-stretch md:gap-6 md:p-6"
      >
        <span className="w-full px-3 md:w-auto">
          <LogoLockup />
        </span>
        <div className="flex gap-1 md:flex-col">
          <NavItem href="/" current={page === "home"}>
            Home
          </NavItem>
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-2 md:mt-auto md:ml-0 md:flex-col md:items-stretch md:gap-3">
          <NavItem href="/account" current={false}>
            <span className="max-w-32 truncate md:max-w-none">{user.name}</span>
          </NavItem>
          <SignOutButton />
        </div>
      </nav>
      <main className="graph-paper min-w-0 flex-1 px-4 py-8 md:px-10 md:py-9">
        {children}
      </main>
    </div>
  );
}
