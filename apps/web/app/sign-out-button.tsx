"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { authClient } from "@/lib/auth-client";

/** Ends the session on the server, not just in this browser */
export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function signOut() {
    if (pending) return;
    setPending(true);
    setFailed(false);
    try {
      const { error } = await authClient.signOut();
      if (!error) {
        router.replace("/sign-in");
        return;
      }
    } catch {
      // Shown below, the same as a server error
    }
    setPending(false);
    setFailed(true);
  }

  return (
    <>
      {failed && (
        <Alert tone="danger">
          We couldn't sign you out. Check your connection and try again.
        </Alert>
      )}
      <Button
        variant="secondary"
        className="w-full"
        disabled={pending}
        aria-busy={pending}
        onClick={signOut}
      >
        {pending ? "Signing out" : "Sign out"}
      </Button>
    </>
  );
}
