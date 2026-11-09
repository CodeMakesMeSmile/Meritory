// The word lists are large, so they load on the first keystroke, not with the page
let passwordRules: Promise<typeof import("@meritory/password")> | undefined;
export const loadPasswordRules = () => {
  passwordRules ??= import("@meritory/password");
  return passwordRules;
};
