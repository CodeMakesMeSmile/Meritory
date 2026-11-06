import { createAuthClient } from "better-auth/react";

// Same origin as the page. The web server forwards /api/v1 to the API.
export const authClient = createAuthClient({ basePath: "/api/v1/auth" });

/** Hands the address to the check email page without putting it in the URL */
export const SIGN_UP_EMAIL_KEY = "meritory:sign-up-email";
