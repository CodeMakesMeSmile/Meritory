import { useEffect, useState } from "react";
import { authClient } from "./auth-client";

// Matches the server's limit of 3 sends a minute
const WAIT_MS = 60_000;

const NOTICES = {
  sent: {
    tone: "success",
    text: "We sent a new link. The old one no longer works.",
  },
  offline: {
    tone: "info",
    text: "You're offline. Sending a new link needs a connection.",
  },
  limited: {
    tone: "info",
    text: "Too many tries. Wait a minute, then try again.",
  },
  failed: {
    tone: "info",
    text: "Something went wrong on our side. Try again in a moment.",
  },
} as const;

const countdown = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

/** Sends a fresh verification link, then counts down before allowing another */
export function useResend() {
  const [outcome, setOutcome] = useState<keyof typeof NOTICES | null>(null);
  const [pending, setPending] = useState(false);
  const [until, setUntil] = useState(0);
  const [now, setNow] = useState(0);

  // Counts from a deadline, so a throttled background tab doesn't fall behind
  useEffect(() => {
    if (!until) return;
    const timer = setInterval(() => {
      const time = Date.now();
      setNow(time);
      if (time >= until) setUntil(0);
    }, 250);
    return () => clearInterval(timer);
  }, [until]);

  const secondsLeft = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;

  async function send(email: string) {
    if (pending || secondsLeft > 0) return;
    if (!navigator.onLine) {
      setOutcome("offline");
      return;
    }
    setPending(true);
    try {
      const { error } = await authClient.sendVerificationEmail({ email });
      if (error) {
        setOutcome(error.status === 429 ? "limited" : "failed");
        return;
      }
      const time = Date.now();
      setNow(time);
      setUntil(time + WAIT_MS);
      setOutcome("sent");
    } catch {
      setOutcome("offline");
    } finally {
      setPending(false);
    }
  }

  let label = "Send a new link";
  if (pending) label = "Sending link";
  else if (secondsLeft > 0) label = `Send again in ${countdown(secondsLeft)}`;

  return {
    send,
    pending,
    waiting: secondsLeft > 0,
    label,
    notice: outcome ? NOTICES[outcome] : null,
  };
}
