import { afterEach, describe, expect, it, vi } from "vitest";

const saveTimeZone = vi.hoisted(() => vi.fn());
vi.mock("@/lib/recall-api", () => ({ saveTimeZone }));

const { syncTimeZone } = await import("./time-zone-sync.tsx");

const inZone = (timeZone: string) =>
  vi.spyOn(Intl, "DateTimeFormat").mockReturnValue({
    resolvedOptions: () => ({ timeZone }),
  } as Intl.DateTimeFormat);

describe("syncTimeZone", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    saveTimeZone.mockReset();
  });

  it("sends nothing when the server already has this zone", async () => {
    inZone("America/Toronto");
    expect(await syncTimeZone("America/Toronto")).toBe("America/Toronto");
    expect(saveTimeZone).not.toHaveBeenCalled();
  });

  it("sets it back after another device changed it", async () => {
    inZone("America/Toronto");
    saveTimeZone.mockResolvedValue({ ok: true });
    expect(await syncTimeZone("America/Vancouver")).toBe("America/Toronto");
    expect(saveTimeZone).toHaveBeenCalledWith("America/Toronto");
  });

  it("keeps the server's zone when the save fails", async () => {
    inZone("America/Toronto");
    saveTimeZone.mockResolvedValue({ ok: false });
    expect(await syncTimeZone("UTC")).toBe("UTC");
  });

  it("doesn't send a zone again after the server refused it", async () => {
    inZone("Mars/Olympus_Mons");
    saveTimeZone.mockResolvedValue({
      ok: false,
      reason: "failed",
      code: "validation_failed",
    });
    expect(await syncTimeZone("UTC")).toBe("UTC");
    expect(await syncTimeZone("UTC")).toBe("UTC");
    expect(saveTimeZone).toHaveBeenCalledTimes(1);
  });

  it("tries again after a rate limit or a dropped connection", async () => {
    inZone("Asia/Tokyo");
    saveTimeZone.mockResolvedValue({
      ok: false,
      reason: "failed",
      code: "rate_limited",
    });
    await syncTimeZone("UTC");
    saveTimeZone.mockResolvedValue({ ok: false, reason: "failed" });
    await syncTimeZone("UTC");
    await syncTimeZone("UTC");
    expect(saveTimeZone).toHaveBeenCalledTimes(3);
  });
});
