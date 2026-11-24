"use client";

import {
  ENTER_A_NUMBER,
  PRACTICE_SAVED,
  rehearsalHelp,
  wholeNumber,
} from "@meritory/recall-client";
import { type FormEvent, useState } from "react";
import { Segmented } from "@/components/segmented";
import { LANGUAGE_NAMES } from "@/lib/code";
import type { SettingsResponse } from "@/lib/recall-api";
import { Card, Row } from "../account/card";
import { Footer, NumberField, OfflineAlert, strayErrors } from "./parts";
import { useOnline, useSave } from "./use-save";

type Language = SettingsResponse["settings"]["codeLanguage"];

const CLOCKS = [
  { key: "designReview", label: "Design review" },
  { key: "classDesign", label: "Class design" },
  { key: "storyAnswer", label: "Story answer" },
] as const;

/** Rehearsal clocks and the language every coding exercise starts in */
export function PracticeCard({
  data,
  onSaved,
}: {
  data: SettingsResponse;
  onSaved: (data: SettingsResponse) => void;
}) {
  const { settings, suggested } = data;
  const online = useOnline();
  const { save, pending, notice, errors, setErrors } = useSave(onSaved);
  const [minutes, setMinutes] = useState(() =>
    Object.fromEntries(
      CLOCKS.map(({ key }) => [key, String(settings.rehearsalMinutes[key])]),
    ),
  );
  const [language, setLanguage] = useState<Language>(settings.codeLanguage);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const typed = Object.fromEntries(
      CLOCKS.map(({ key }) => [key, wholeNumber(minutes[key] ?? "")]),
    );
    const missing = Object.fromEntries(
      CLOCKS.filter(({ key }) => typed[key] === null).map(({ key }) => [
        `rehearsalMinutes.${key}`,
        ENTER_A_NUMBER,
      ]),
    );
    if (Object.keys(missing).length > 0) {
      setErrors(missing);
      return;
    }
    await save(
      {
        rehearsalMinutes: {
          designReview: typed.designReview ?? 0,
          classDesign: typed.classDesign ?? 0,
          storyAnswer: typed.storyAnswer ?? 0,
        },
        codeLanguage: language,
      },
      () => PRACTICE_SAVED,
    );
  }

  return (
    <Card
      title="Practice"
      description="Rehearsal clocks, and the language your code runs in."
    >
      <OfflineAlert online={online} />
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-3">
            {CLOCKS.map(({ key, label }) => (
              <NumberField
                key={key}
                id={`minutes-${key}`}
                label={label}
                value={minutes[key] ?? ""}
                onChange={(value) =>
                  setMinutes((now) => ({ ...now, [key]: value }))
                }
                unit="min"
                error={errors[`rehearsalMinutes.${key}`]}
                className=""
              />
            ))}
          </div>
          <p className="text-small text-secondary">
            {rehearsalHelp(suggested.rehearsalMinutes)}
          </p>
        </div>
        <Row>
          <Segmented<Language>
            label="Coding language"
            value={language}
            onChange={setLanguage}
            segments={(["typescript", "python"] as const).map((value) => ({
              value,
              label: LANGUAGE_NAMES[value],
              suggested: value === suggested.codeLanguage,
            }))}
          />
        </Row>
        <Footer
          notice={notice}
          pending={pending}
          online={online}
          stray={strayErrors(
            errors,
            (field) =>
              field.startsWith("rehearsalMinutes.") || field === "codeLanguage",
          )}
        />
      </form>
    </Card>
  );
}
