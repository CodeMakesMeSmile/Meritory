import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { buttonClass } from "@/components/button";

export const metadata: Metadata = { title: "Page not found · Meritory" };

export default function NotFound() {
  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-display">Page not found</h1>
          <p className="text-body text-secondary">
            This page doesn't exist, or it has moved. Check the address, or go
            back to Home.
          </p>
        </div>
        <Link href="/" className={`${buttonClass()} w-full`}>
          Go to Home
        </Link>
      </div>
    </AuthShell>
  );
}
