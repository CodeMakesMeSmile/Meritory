"use client";

import { useState } from "react";
import { Button } from "@/components/button";
import { authClient } from "@/lib/auth-client";
import { clearDrafts } from "@/lib/device-storage";

/** Ends this device's session on the server, then forgets this browser's drafts */
export async function signOutHere(): Promise<boolean> {
  try {
    const { error } = await authClient.signOut();
    if (error) return false;
  } catch {
    // Reported the same as a server error
    return false;
  }
  clearDrafts();
  return true;
}

export function SignOutButton({
  disabled,
  onFailed,
}: {
  disabled: boolean;
  onFailed: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (pending) return;
    setPending(true);
    if (await signOutHere()) {
      // A full load, so Back can't bring a signed-in page out of memory
      window.location.replace("/sign-in");
      return;
    }
    setPending(false);
    onFailed();
  }

  return (
    <Button
      variant="secondary"
      className="w-full sm:w-50"
      disabled={disabled || pending}
      waiting={pending}
      aria-busy={pending}
      aria-label="Sign out of this device"
      onClick={() => void signOut()}
    >
      {pending ? "Signing out" : "Sign out"}
    </Button>
  );
}
