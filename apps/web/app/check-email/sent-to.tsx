"use client";

import { useSignUpEmail } from "@/lib/sign-up-email";

export function SentTo() {
  const email = useSignUpEmail();
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
