"use client";

import { useSyncExternalStore } from "react";
import { SIGN_UP_EMAIL_KEY } from "@/lib/auth-client";

function readEmail(): string | null {
  try {
    return sessionStorage.getItem(SIGN_UP_EMAIL_KEY);
  } catch {
    return null;
  }
}

const noSubscription = () => () => {};

/** The address comes from the sign-up form, never from the URL */
export function SentTo() {
  const email = useSyncExternalStore(noSubscription, readEmail, () => null);
  return (
    <p className="text-body">
      {email ? (
        <>
          We sent a link to <strong className="font-semibold">{email}</strong>.
          It works for 1 hour.
        </>
      ) : (
        "We sent you a link. It works for 1 hour."
      )}
    </p>
  );
}
