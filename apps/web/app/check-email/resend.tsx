"use client";

import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { useSignUpEmail } from "@/lib/sign-up-email";
import { useResend } from "@/lib/use-resend";

/** Without the address from sign-up there is nothing to resend to */
export function Resend() {
  const email = useSignUpEmail();
  const resend = useResend();
  return (
    <>
      {resend.notice && (
        <Alert tone={resend.notice.tone}>{resend.notice.text}</Alert>
      )}
      <p className="text-small text-secondary">
        No email after a few minutes? Check your spam folder
        {email ? ", or send a new link." : "."}
      </p>
      {email && (
        <Button
          variant="secondary"
          waiting={resend.waiting}
          aria-busy={resend.pending}
          onClick={() => resend.send(email)}
        >
          {resend.label}
        </Button>
      )}
    </>
  );
}
