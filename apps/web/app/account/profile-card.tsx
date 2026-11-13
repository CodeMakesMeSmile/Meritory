"use client";

import { NAME_ERROR, waitMessage } from "@meritory/contracts/sign-in-messages";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { authClient } from "@/lib/auth-client";
import { Card, Row } from "./card";

type Notice = { tone: "success" | "danger"; text: string };

const OFFLINE = "You're offline. Saving your name needs a connection.";
const FAILED = "Something went wrong on our side. Try again in a moment.";

interface ProfileCardProps {
  name: string;
  email: string;
}

export function ProfileCard({ name, email }: ProfileCardProps) {
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function showError(text: string) {
    setError(text);
    input.current?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setNotice(null);
    const trimmed = value.trim();
    if (!trimmed) {
      showError(NAME_ERROR);
      return;
    }
    if (!navigator.onLine) {
      setNotice({ tone: "danger", text: OFFLINE });
      return;
    }

    setPending(true);
    let retryAfter: string | null = null;
    try {
      const { error: failed } = await authClient.updateUser(
        { name: trimmed },
        {
          onError: ({ response }) => {
            retryAfter = response.headers.get("X-Retry-After");
          },
        },
      );
      if (!failed) {
        setValue(trimmed);
        setNotice({ tone: "success", text: "Name saved." });
        // The rail and other pages read the name on the server
        router.refresh();
      } else if (failed.code === "NAME_INVALID") {
        showError(failed.message ?? NAME_ERROR);
      } else if (failed.status === 401) {
        router.replace("/sign-in?next=/account");
      } else if (failed.status === 429) {
        setNotice({ tone: "danger", text: waitMessage(retryAfter) });
      } else {
        setNotice({ tone: "danger", text: FAILED });
      }
    } catch {
      setNotice({ tone: "danger", text: OFFLINE });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card title="Profile">
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <form
        noValidate
        onSubmit={onSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-start"
      >
        <div className="min-w-0 sm:flex-1">
          <TextField
            ref={input}
            id="name"
            label="What should we call you?"
            autoComplete="nickname"
            error={error}
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setError(undefined);
            }}
          />
        </div>
        <Button
          type="submit"
          variant="secondary"
          className="w-full sm:mt-7 sm:w-50"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? "Saving" : "Save name"}
        </Button>
      </form>
      <Row className="flex flex-col gap-2">
        <p className="text-small font-semibold">Email</p>
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="text-body break-all">{email}</span>
          <span className="text-small text-success">Verified</span>
        </p>
      </Row>
    </Card>
  );
}
