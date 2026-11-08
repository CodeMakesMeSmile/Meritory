"use client";

import { useState } from "react";
import { PasswordCard } from "./password-card";
import { SessionsCard } from "./sessions-card";

/** The cards that change together, since a new password ends other sessions */
export function AccountCards({ name, email }: { name: string; email: string }) {
  const [version, setVersion] = useState(0);
  return (
    <>
      <SessionsCard key={version} />
      <PasswordCard
        name={name}
        email={email}
        onChanged={() => setVersion((now) => now + 1)}
      />
    </>
  );
}
