/** What a checked card shows above its answer */
export interface Checked {
  right: boolean;
  /** Answered with I don't know, so the answer shows with no pick beside it */
  dontKnow: boolean;
  /** The reminder that trying first helps, shown on the first miss only */
  encourage: boolean;
  /** How long until the card comes back, such as 10 minutes. Null once the rating was turned down, since nothing was scheduled. */
  wait: string | null;
}
