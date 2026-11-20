"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/button";
import { authClient } from "@/lib/auth-client";

/** Ends this device's session on the server, not just in this browser */
export function SignOutButton({
  disabled,
  onFailed,
}: {
  disabled: boolean;
  onFailed: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (pending) return;
    setPending(true);
    try {
      const { error } = await authClient.signOut();
      if (!error) {
        router.replace("/sign-in");
        return;
      }
    } catch {
      // Reported the same as a server error
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
