/**
 * The time a review counts as happening, for scheduling.
 *
 * Offline phones send the time the answer was given. We trust it only between
 * the prompt's previous accepted review and the moment the server accepted
 * this one, so a wrong clock can't reorder past progress or land in the future.
 */
export function effectiveReviewTime(
  claimedAt: Date,
  previousReviewAt: Date | null,
  acceptedAt: Date,
): Date {
  const floor = previousReviewAt?.getTime() ?? Number.NEGATIVE_INFINITY;
  const time = Math.min(
    Math.max(claimedAt.getTime(), floor),
    acceptedAt.getTime(),
  );
  return new Date(time);
}
