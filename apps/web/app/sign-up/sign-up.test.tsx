import { SIGN_UP_MESSAGES } from "@meritory/contracts/sign-in-messages";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {} }),
}));

const signUpEmail = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth-client", () => ({
  authClient: { signUp: { email: signUpEmail } },
  SIGN_UP_EMAIL_KEY: "meritory:sign-up-email",
}));

const { createAccount } = await import("./sign-up-form.tsx");

const fields = {
  name: "Rowan",
  email: "rowan@meritory.test",
  password: "copper lantern orbit meadow",
};

describe("createAccount", () => {
  afterEach(() => signUpEmail.mockReset());

  it("says the connection dropped, so the form can turn the button back on", async () => {
    signUpEmail.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await createAccount(fields)).toEqual({
      ok: false,
      message: SIGN_UP_MESSAGES.offline,
    });
  });

  it("passes a working sign-up through", async () => {
    signUpEmail.mockResolvedValue({ error: null });
    expect(await createAccount(fields)).toEqual({ ok: true });
  });

  it("puts a field's problem under that field", async () => {
    signUpEmail.mockResolvedValue({
      error: {
        code: "NAME_INVALID",
        message: "Use a shorter name.",
        status: 400,
      },
    });
    expect(await createAccount(fields)).toEqual({
      ok: false,
      field: "name",
      message: "Use a shorter name.",
    });
  });

  it("says the server failed for anything else", async () => {
    signUpEmail.mockResolvedValue({
      error: { code: "UNKNOWN", message: "", status: 500 },
    });
    expect(await createAccount(fields)).toEqual({
      ok: false,
      message: SIGN_UP_MESSAGES.failed,
    });
  });
});
