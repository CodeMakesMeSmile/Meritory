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
        className="flex flex-col gap-6 bg-rail p-4 md:sticky md:top-0 md:h-screen md:w-59 md:shrink-0 md:p-6"
      >
        <span className="px-3">
          <LogoLockup />
        </span>
        <div className="flex flex-col gap-1">
          <NavItem href="/" current={page === "home"}>
            Home
          </NavItem>
        </div>
        <div className="flex flex-col gap-3 md:mt-auto">
          <NavItem href="/account" current={false}>
            {user.name}
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
