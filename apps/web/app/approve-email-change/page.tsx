import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { FAILED_URL } from "@/lib/email-change";
import { ApproveForm } from "./approve-form";

export const metadata: Metadata = {
  title: "Approve your new email · Meritory",
  // The token is in this page's URL
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string | string[] }>;
}

// The email to the current address links here, and nothing changes until Approve is pressed
export default async function ApproveEmailChangePage({
  searchParams,
}: PageProps) {
  const { token } = await searchParams;
  if (typeof token !== "string" || !token) redirect(FAILED_URL);

  return (
    <AuthShell>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="text-display">Approve your new email</h1>
          <p className="text-body text-secondary">
            Press Approve to send a confirmation link to your new address. If
            you didn't ask for this, ignore this page and change your password.
          </p>
        </div>
        <ApproveForm token={token} />
      </div>
    </AuthShell>
  );
}
