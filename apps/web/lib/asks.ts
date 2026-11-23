/** Tells an answer that's still wanted from one that comes back after a cancel */
export function createAsks() {
  let cancels = 0;
  return {
    cancel() {
      cancels += 1;
    },
    /** A check that holds until the next cancel */
    ask() {
      const asked = cancels;
      return () => asked === cancels;
    },
  };
}
