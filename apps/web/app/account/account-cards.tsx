"use client";

import type { SignInMethods } from "@meritory/contracts";
import { useState } from "react";
import { PasswordCard } from "./password-card";
import { SessionsCard } from "./sessions-card";

interface AccountCardsProps {
  name: string;
  email: string;
  signInMethods: SignInMethods;
  /** Back from signing in again with GitHub or Google */
  confirmed: boolean;
}

/** The cards that change together, since a new password ends other sessions */
export function AccountCards({
  name,
  email,
  signInMethods,
  confirmed,
}: AccountCardsProps) {
  const [version, setVersion] = useState(0);
  // Without a password, signing in again with a provider confirms it's them
  const provider = signInMethods.password
    ? null
    : (signInMethods.providers[0] ?? null);
  return (
    <>
      <SessionsCard key={version} provider={provider} confirmed={confirmed} />
      <PasswordCard
        name={name}
        email={email}
        provider={provider}
        onChanged={() => setVersion((now) => now + 1)}
      />
    </>
  );
}
