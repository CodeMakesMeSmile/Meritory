"use client";

import { linkedText } from "@meritory/contracts/sign-in-messages";
import { useEffect } from "react";
import { Alert } from "@/components/alert";

/** Says a provider was just added, once. Dropping ?linked= keeps a refresh quiet. */
export function LinkedNotice({
  linked,
}: {
  linked: string | string[] | undefined;
}) {
  const text = linkedText(linked);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("linked")) return;
    url.searchParams.delete("linked");
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  return text ? <Alert tone="success">{text}</Alert> : null;
}
