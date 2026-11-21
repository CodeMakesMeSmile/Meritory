"use client";

import type { InterviewDateResponse } from "@meritory/contracts";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { Alert } from "@/components/alert";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import { INTERVIEW_ERRORS, saveInterviewDate } from "@/lib/recall-api";
import { Card, Row } from "./card";

const OFFLINE = "You're offline. This needs a connection.";
const FAILED = "Something went wrong on our side. Try again in a moment.";
const PASSED = "That date has passed. Pick a date after today.";
const NOT_A_DATE = "That isn't a date. Pick one from the calendar.";
const SOONER =
  "cards come back a bit sooner, aiming for 95% recall instead of 90%.";

/** December 14, from 2026-12-14, whatever the reader's time zone */
export function dayName(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** What the line under the field says for each stage */
export function statusLine(state: InterviewDateResponse): string | null {
  if (!state.date) return null;
  if (state.status === "on")
    return `On now. Until ${dayName(state.date)}, ${SOONER}`;
  if (state.status === "later" && state.startsOn) {
    return `Saved. From ${dayName(state.startsOn)}, ${SOONER}`;
  }
  if (state.status === "passed") {
    return `${dayName(state.date)} has passed, so recall is back to its usual 90%. Add a new date any time.`;
  }
  return null;
}

type Notice = { tone: "success" | "danger"; text: string };

export function InterviewCard({ initial }: { initial: InterviewDateResponse }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  // A passed date leaves the field empty, ready for a new one
  const [value, setValue] = useState(
    initial.status === "passed" ? "" : (initial.date ?? ""),
  );
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pending, setPending] = useState<"save" | "remove" | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function send(date: string | null) {
    setNotice(null);
    setError(undefined);
    if (!navigator.onLine) {
      setNotice({ tone: "danger", text: OFFLINE });
      return;
    }
    setPending(date === null ? "remove" : "save");
    const result = await saveInterviewDate(date);
    setPending(null);
    if (result.ok) {
      setState(result.data);
      setValue(result.data.date ?? "");
      if (date === null) {
        setNotice({
          tone: "success",
          text: "Date removed. Recall is back to its usual 90%.",
        });
      }
      return;
    }
    if (result.reason === "signed_out") {
      router.replace("/sign-in?next=/account");
    } else if (result.code === INTERVIEW_ERRORS.datePassed) {
      setError(PASSED);
      input.current?.focus();
    } else if (result.code === INTERVIEW_ERRORS.notADate) {
      setError(NOT_A_DATE);
      input.current?.focus();
    } else {
      setNotice({ tone: "danger", text: FAILED });
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!value) {
      setError("Pick a date first.");
      input.current?.focus();
      return;
    }
    void send(value);
  }

  const line = statusLine(state);
  const removable = state.date !== null && state.status !== "passed";

  return (
    <Card
      title="Interview date"
      description="Optional. Add your date and recall gets more thorough in the last 4 weeks, so more cards are fresh on the day. You'll see a few more cards each day while it's on."
    >
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}
      <form
        noValidate
        onSubmit={onSubmit}
        className="flex flex-col gap-3 sm:flex-row sm:items-start"
      >
        <div className="min-w-0 sm:flex-1">
          <TextField
            ref={input}
            id="interview-date"
            type="date"
            label="Date of your interview"
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
          disabled={pending !== null}
          aria-busy={pending === "save"}
        >
          {pending === "save" ? "Saving" : "Save date"}
        </Button>
      </form>
      {line && (
        <p className="text-small text-secondary" aria-live="polite">
          {line}
        </p>
      )}
      {removable && (
        <Row className="flex sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-50"
            disabled={pending !== null}
            aria-busy={pending === "remove"}
            onClick={() => void send(null)}
          >
            {pending === "remove" ? "Removing" : "Remove date"}
          </Button>
        </Row>
      )}
    </Card>
  );
}
