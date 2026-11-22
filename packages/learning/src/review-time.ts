/**
 * The time a review counts as happening, for scheduling.
 *
 * Offline phones send the time the answer was given. We trust it only between
 * the card's previous accepted review, or when it was added before its first,
 * and the moment the server accepted this one. So a wrong clock can't reorder
 * past progress, start a schedule before the card existed, or land in the future.
 */
export function effectiveReviewTime(
  claimedAt: Date,
  notBefore: Date,
  acceptedAt: Date,
): Date {
  const time = Math.min(
    Math.max(claimedAt.getTime(), notBefore.getTime()),
    acceptedAt.getTime(),
  );
  return new Date(time);
}
