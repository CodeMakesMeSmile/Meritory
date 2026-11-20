/** What a checked card shows above its answer */
export interface Checked {
  right: boolean;
  /** The reminder that trying first helps, shown on the first miss only */
  encourage: boolean;
  /** How long until the card comes back, such as 10 minutes */
  wait: string;
}
