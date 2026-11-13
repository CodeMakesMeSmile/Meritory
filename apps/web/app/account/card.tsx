import type { ReactNode } from "react";

/** An outlined section of the account page */
export function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const id = `${title.toLowerCase().replace(/\W+/g, "-")}-title`;
  return (
    <section
      aria-labelledby={id}
      className="flex flex-col gap-4 border border-border bg-card p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-h3">
          {title}
        </h2>
        {description && (
          <p className="text-small text-secondary">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/** A row under a hairline, like the session rows and the button footer */
export function Row({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-t border-border-subtle pt-4 ${className}`}>
      {children}
    </div>
  );
}
