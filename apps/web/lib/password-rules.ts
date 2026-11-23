/** Loads once and shares the promise, but forgets a failure so the next call tries again */
export function retryingLoader<T>(load: () => Promise<T>): () => Promise<T> {
  let loading: Promise<T> | undefined;
  return () => {
    loading ??= load().catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
    return loading;
  };
}

// The word lists are large, so they load on the first keystroke, not with the page
export const loadPasswordRules = retryingLoader(
  () => import("@meritory/password"),
);

/** Null when they didn't load, so each form can say why in its own words */
export const passwordRulesOrNull = () => loadPasswordRules().catch(() => null);
