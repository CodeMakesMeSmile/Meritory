"use client";

import type { SignInMethods } from "@meritory/contracts";
import { useState } from "react";
import type { ProviderNotice } from "@/lib/providers";
import { MethodsCard } from "./methods-card";
import { PasswordCard } from "./password-card";
import { SessionsCard } from "./sessions-card";

interface AccountCardsProps {
  name: string;
  email: string;
  signInMethods: SignInMethods;
  /** What GitHub or Google sent them back with */
  notice: ProviderNotice | null;
  /** Back from signing in again with GitHub or Google */
  confirmed: boolean;
}

/** The cards that change together, since a new password ends other sessions */
export function AccountCards({
  name,
  email,
  signInMethods,
  notice,
  confirmed,
}: AccountCardsProps) {
  const [version, setVersion] = useState(0);
  // Without a password, signing in again with a provider confirms it's them
  const provider = signInMethods.passwordSetAt
    ? null
    : (signInMethods.providers[0]?.id ?? null);
  return (
    <>
      <MethodsCard
        methods={signInMethods}
        notice={notice}
        provider={provider}
        confirmed={confirmed}
      />
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
