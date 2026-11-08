/** The rate limit message, using the wait the server sent in X-Retry-After */
export function waitMessage(retryAfter: string | null) {
  const seconds = Number(retryAfter);
  if (!Number.isInteger(seconds) || seconds <= 0) {
    return "Too many tries. Wait a few seconds, then try again.";
  }
  const unit = seconds === 1 ? "second" : "seconds";
  return `Too many tries. Wait ${seconds} ${unit}, then try again.`;
}
