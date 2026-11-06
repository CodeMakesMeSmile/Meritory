import type { ComponentProps, ReactNode } from "react";

interface TextFieldProps extends ComponentProps<"input"> {
  id: string;
  label: string;
  helper?: ReactNode;
  error?: string;
  /** Sits at the end of the label row */
  aside?: ReactNode;
  /** Sits inside the box, after the input */
  trailing?: ReactNode;
  /** Sits between the box and the helper text */
  below?: ReactNode;
}

export function TextField({
  id,
  label,
  helper,
  error,
  aside,
  trailing,
  below,
  ...input
}: TextFieldProps) {
  const helperId = `${id}-helper`;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-small font-semibold">
          {label}
        </label>
        {aside}
      </div>
      <div className="field-box" data-invalid={error ? "" : undefined}>
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={helper || error ? helperId : undefined}
          className="text-body text-primary"
          {...input}
        />
        {trailing}
      </div>
      {below}
      {(error || helper) && (
        <p
          id={helperId}
          className={`text-small ${error ? "text-danger" : "text-secondary"}`}
        >
          {error ?? helper}
        </p>
      )}
    </div>
  );
}
