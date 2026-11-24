"use client";

import { useId } from "react";

export interface Segment<T extends string> {
  value: T;
  label: string;
  /** Marks the value we suggest */
  suggested?: boolean;
}

/**
 * Options in a row that work as radio buttons, so arrow keys move between
 * them and the focus ring sits on the option
 */
export function Segmented<T extends string>({
  label,
  segments,
  value,
  onChange,
}: {
  label: string;
  segments: readonly Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  const name = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-small font-semibold">{label}</legend>
      <div className="flex w-full gap-1 bg-sunken p-1 sm:w-fit">
        {segments.map((segment) => {
          const picked = segment.value === value;
          return (
            <label
              key={segment.value}
              className={`flex min-h-control flex-1 cursor-pointer flex-col items-center justify-center px-4 py-1 text-center text-small has-focus-visible:shadow-(--focus-ring) sm:w-32 sm:flex-none ${
                picked
                  ? "bg-card font-semibold text-primary"
                  : "text-secondary hover:text-primary"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={segment.value}
                checked={picked}
                onChange={() => onChange(segment.value)}
                className="sr-only"
              />
              <span>{segment.label}</span>
              {segment.suggested && (
                <span className="font-normal text-secondary">suggested</span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
