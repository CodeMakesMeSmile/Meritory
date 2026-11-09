import { randomUUID } from "node:crypto";
import { eq, like } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "../db/client.ts";
import { users } from "../db/schema.ts";
import type { Mail } from "../mail/mailer.ts";
import { createAuth } from "./auth.ts";

const url = process.env.TEST_DATABASE_URL;

const ORIGIN = "https://meritory.test";
const PASSWORD = "violet harbor tractor sandwich";
const EXPO_GO = "exp://192.168.1.20:8081";
const APP = "meritory://";

describe.skipIf(!url)("requests from the phone app", () => {
  const database = createDatabase(url ?? "");
  const sent: Mail[] = [];

  const authWith = (expoGoScheme?: string) =>
    createAuth({
      db: database.db,
      secret: "x".repeat(32),
      baseUrl: `${ORIGIN}/api/v1/auth`,
      webOrigin: ORIGIN,
      appScheme: APP,
      expoGoScheme,
      mailer: { send: async (mail) => void sent.push(mail) },
      log: { error: () => {} },
      rateLimit: false,
    });

  const development = authWith("exp://");
  const production = authWith();

  const post = (
    auth: ReturnType<typeof createAuth>,
    path: string,
    headers: Record<string, string>,
    body: object,
  ) =>
    auth.handler(
      new Request(`${ORIGIN}/api/v1/auth${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
      }),
    );

  const newEmail = () => `phone-${randomUUID()}@meritory.test`;

  const signUp = (
    auth: ReturnType<typeof createAuth>,
    headers: Record<string, string>,
    email = newEmail(),
  ) =>
    post(auth, "/sign-up/email", headers, {
      name: "Rowan",
      email,
      password: PASSWORD,
    });

  /** Decoded, so an address inside a query string can't hide */
  const mailedLink = (email: string) =>
    decodeURIComponent(sent.find((item) => item.to === email)?.text ?? "");

  afterAll(async () => {
    await database.db
      .delete(users)
      .where(like(users.email, "phone-%@meritory.test"));
    await database.close();
  });

  it("accepts Expo Go in development", async () => {
    const res = await signUp(development, { "expo-origin": EXPO_GO });
    expect(res.status).toBe(200);
  });

  it("refuses Expo Go in production", async () => {
    const res = await signUp(production, { "expo-origin": EXPO_GO });
    expect(res.status).toBe(403);
  });

  it("accepts the installed app in production", async () => {
    const res = await signUp(production, { "expo-origin": `${APP}home` });
    expect(res.status).toBe(200);
  });

  it("refuses another app's scheme", async () => {
    const res = await signUp(development, { "expo-origin": "evil://home" });
    expect(res.status).toBe(403);
  });

  it("lets a browser's own origin outrank the phone header", async () => {
    const res = await signUp(development, {
      origin: "https://evil.test",
      "expo-origin": EXPO_GO,
    });
    expect(res.status).toBe(403);
  });

  it("keeps a sign-up link on the website when the app asks for a deep link", async () => {
    const email = newEmail();
    await post(
      development,
      "/sign-up/email",
      { "expo-origin": EXPO_GO },
      {
        name: "Rowan",
        email,
        password: PASSWORD,
        callbackURL: `${APP}email-confirmed`,
      },
    );

    const link = mailedLink(email);
    expect(link).toContain(`${ORIGIN}/`);
    expect(link).toContain("email-confirmed");
    expect(link).not.toContain(APP);
    expect(link).not.toContain("exp://");
  });

  it("keeps a reset link on the website when the app asks for a deep link", async () => {
    const email = newEmail();
    await signUp(development, { "expo-origin": EXPO_GO }, email);
    await database.db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.email, email));
    sent.length = 0;

    await post(
      development,
      "/request-password-reset",
      { "expo-origin": EXPO_GO },
      { email, redirectTo: `${APP}reset-password` },
    );

    // The reset email goes out after the response
    await expect.poll(() => sent.some((item) => item.to === email)).toBe(true);
    const link = mailedLink(email);
    expect(link).toContain(`${ORIGIN}/`);
    expect(link).not.toContain(APP);
    expect(link).not.toContain("exp://");
  });
});
