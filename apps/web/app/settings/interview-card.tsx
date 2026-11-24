"use client";

import {
  ENTER_A_NUMBER,
  INTERVIEW_DESCRIPTION,
  interviewStatusLine,
  interviewTargetHelp,
  interviewWeeksHelp,
  wholeNumber,
} from "@meritory/recall-client";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/button";
import { TextField } from "@/components/text-field";
import type { SettingsResponse } from "@/lib/recall-api";
import { Card } from "../account/card";
import { Footer, NumberField, OfflineAlert, strayErrors } from "./parts";
import { useOnline, useSave } from "./use-save";

const CARD_FIELDS = new Set([
  "interviewDate",
  "interviewTarget",
  "interviewWeeks",
]);

/** The date, and how recall changes in the weeks before it */
export function InterviewCard({
  data,
  onSaved,
}: {
  data: SettingsResponse;
  onSaved: (data: SettingsResponse) => void;
}) {
  const { settings, suggested, interview } = data;
  const online = useOnline();
  const { save, pending, notice, errors, setErrors } = useSave(onSaved);
  // A passed date leaves the field empty, ready for a new one
  const [date, setDate] = useState(
    interview.status === "passed" ? "" : (interview.date ?? ""),
  );
  const [target, setTarget] = useState(String(settings.interviewTarget));
  const [weeks, setWeeks] = useState(String(settings.interviewWeeks));
  const [removing, setRemoving] = useState(false);

  const line = interviewStatusLine(interview, settings);
  const savedLine = (next: SettingsResponse) =>
    interviewStatusLine(next.interview, next.settings) ?? "Saved.";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const interviewTarget = wholeNumber(target);
    const interviewWeeks = wholeNumber(weeks);
    const missing: Record<string, string> = {};
    if (interviewTarget === null) missing.interviewTarget = ENTER_A_NUMBER;
    if (interviewWeeks === null) missing.interviewWeeks = ENTER_A_NUMBER;
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      return;
    }
    await save(
      {
        interviewDate: date || null,
        interviewTarget: interviewTarget ?? undefined,
        interviewWeeks: interviewWeeks ?? undefined,
      },
      savedLine,
    );
  }

  async function remove() {
    setRemoving(true);
    const removed = await save(
      { interviewDate: null },
      (next) =>
        `Date removed. Recall is back to your usual ${next.settings.recallTarget}%.`,
    );
    setRemoving(false);
    if (removed) setDate("");
  }

  const removable = interview.date !== null && interview.status !== "passed";

  return (
    <Card title="Interview date" description={INTERVIEW_DESCRIPTION}>
      <OfflineAlert online={online} />
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="sm:max-w-80">
          <TextField
            id="interview-date"
            type="date"
            label="Date of your interview"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            error={errors.interviewDate}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            id="interview-target"
            label="Recall target before it"
            value={target}
            onChange={setTarget}
            unit="%"
            helper={interviewTargetHelp(suggested.interviewTarget)}
            error={errors.interviewTarget}
            className=""
          />
          <NumberField
            id="interview-weeks"
            label="Weeks before"
            value={weeks}
            onChange={setWeeks}
            helper={interviewWeeksHelp(suggested.interviewWeeks)}
            error={errors.interviewWeeks}
            className=""
          />
        </div>
        {line && !notice && (
          <p className="text-small text-secondary" aria-live="polite">
            {line}
          </p>
        )}
        <Footer
          notice={notice}
          pending={pending && !removing}
          online={online}
          stray={strayErrors(errors, (field) => CARD_FIELDS.has(field))}
        >
          {removable && (
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-50"
              disabled={pending || !online}
              aria-busy={removing}
              onClick={() => void remove()}
            >
              {removing ? "Removing" : "Remove date"}
            </Button>
          )}
        </Footer>
      </form>
    </Card>
  );
}
