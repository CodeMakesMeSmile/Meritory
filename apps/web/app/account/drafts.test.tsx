import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {}, refresh: () => {} }),
}));

const clearDrafts = vi.hoisted(() => vi.fn());
vi.mock("@/lib/device-storage", () => ({ clearDrafts }));

const signOut = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut } }));

const deleteAccount = vi.hoisted(() => vi.fn());
vi.mock("@/lib/account-api", () => ({
  deleteAccount,
  listSessions: vi.fn(),
}));

const { signOutHere } = await import("./sign-out-button.tsx");
const { deleteEverything } = await import("./delete-card.tsx");

describe("drafts in this browser", () => {
  afterEach(() => vi.clearAllMocks());

  it("go after a sign-out", async () => {
    signOut.mockResolvedValue({ error: null });
    expect(await signOutHere()).toBe(true);
    expect(clearDrafts).toHaveBeenCalledOnce();
  });

  it.each([
    [
      "the server refuses the sign-out",
      () => signOut.mockResolvedValue({ error: {} }),
    ],
    [
      "the sign-out can't reach the server",
      () => signOut.mockRejectedValue(new Error()),
    ],
  ])("stay when %s", async (_case, arrange) => {
    arrange();
    expect(await signOutHere()).toBe(false);
    expect(clearDrafts).not.toHaveBeenCalled();
  });

  it("go after the account is deleted", async () => {
    deleteAccount.mockResolvedValue({ ok: true, data: undefined });
    expect(await deleteEverything()).toEqual({ ok: true, data: undefined });
    expect(clearDrafts).toHaveBeenCalledOnce();
  });

  it("stay when the deletion fails", async () => {
    deleteAccount.mockResolvedValue({ ok: false, reason: "failed" });
    await deleteEverything();
    expect(clearDrafts).not.toHaveBeenCalled();
  });
});
