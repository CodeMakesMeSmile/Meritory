"use client";

import { digitsOnly, SAVE_OFFLINE } from "@meritory/recall-client";
import type { ReactNode } from "react";
import { Alert } from "@/components/alert";
import { Button, linkClass } from "@/components/button";
import { TextField } from "@/components/text-field";
import { Row } from "../account/card";
import type { FieldErrors, Notice } from "./use-save";

/** The line under a card's changes, then its Save changes button */
export function Footer({
  notice,
  pending,
  online,
  stray = [],
  label = "Save changes",
  children,
}: {
  notice: Notice;
  pending: boolean;
  online: boolean;
  /** Refusals about a setting this card doesn't show */
  stray?: string[];
  label?: string;
  children?: ReactNode;
}) {
  return (
    <>
      {(notice || stray.length > 0) && (
        <div aria-live="polite" className="flex flex-col gap-1">
          {notice && (
            <p
              role={notice.tone === "danger" ? "alert" : "status"}
              className={`text-small ${notice.tone === "danger" ? "text-danger" : "text-success"}`}
            >
              {notice.text}
            </p>
          )}
          {stray.map((text) => (
            <p key={text} role="alert" className="text-small text-danger">
              {text}
            </p>
          ))}
        </div>
      )}
      <Row className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {children}
        <Button
          type="submit"
          variant="secondary"
          className="w-full sm:w-50"
          disabled={pending || !online}
          waiting={!online}
          aria-busy={pending}
        >
          {pending ? "Saving" : label}
        </Button>
      </Row>
    </>
  );
}

export function OfflineAlert({ online }: { online: boolean }) {
  return online ? null : <Alert tone="info">{SAVE_OFFLINE}</Alert>;
}

/** A field that keeps digits only, with a unit after the number */
export function NumberField({
  id,
  label,
  value,
  onChange,
  helper,
  error,
  unit,
  className = "sm:max-w-80",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: ReactNode;
  error?: string;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <TextField
        id={id}
        label={label}
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(digitsOnly(event.target.value))}
        helper={helper}
        error={error}
        trailing={
          unit ? (
            <span aria-hidden="true" className="text-body text-secondary">
              {unit}
            </span>
          ) : undefined
        }
      />
    </div>
  );
}

/** A gold text button under a field, like Use suggested */
export function TextButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${linkClass} flex h-control items-center self-start`}
    >
      {children}
    </button>
  );
}

/** A setting summed up in a line, with a button that opens it */
export function SummaryRow({
  title,
  line,
  action,
  onAction,
}: {
  title: string;
  line: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <Row className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h3 className="text-body font-semibold">{title}</h3>
        <p className="text-small text-secondary">{line}</p>
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full sm:w-50"
        onClick={onAction}
      >
        {action}
      </Button>
    </Row>
  );
}

/** Messages for fields outside this card, so a refusal is never silent */
export function strayErrors(
  errors: FieldErrors,
  shown: (field: string) => boolean,
) {
  return Object.entries(errors)
    .filter(([field]) => !shown(field))
    .map(([, message]) => message);
}
