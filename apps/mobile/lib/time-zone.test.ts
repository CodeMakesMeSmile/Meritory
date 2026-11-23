import { describe, expect, it, vi } from "vitest";
import { createTimeZoneSync } from "./time-zone";

const saved = { ok: true as const, data: undefined };

describe("phone time zone", () => {
  it("sends a zone once, and again when it changes", async () => {
    const save = vi.fn(async (_zone: string) => saved);
    const zones = createTimeZoneSync(save);
    await zones.sync("America/Toronto");
    await zones.sync("America/Toronto");
    await zones.sync("Europe/Paris");
    expect(save.mock.calls).toEqual([["America/Toronto"], ["Europe/Paris"]]);
  });

  it("tries again after a request that didn't arrive", async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, reason: "failed" })
      .mockResolvedValue(saved);
    const zones = createTimeZoneSync(save);
    await zones.sync("America/Toronto");
    await zones.sync("America/Toronto");
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("doesn't resend a zone the server refused", async () => {
    const save = vi.fn(async (_zone: string) => ({
      ok: false as const,
      reason: "failed" as const,
      code: "unknown_time_zone",
      refused: true,
    }));
    const zones = createTimeZoneSync(save);
    await zones.sync("Mars/Olympus");
    await zones.sync("Mars/Olympus");
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("sends the zone again for the next account", async () => {
    const save = vi.fn(async (_zone: string) => saved);
    const zones = createTimeZoneSync(save);
    await zones.sync("America/Toronto");
    zones.reset();
    await zones.sync("America/Toronto");
    expect(save).toHaveBeenCalledTimes(2);
  });

  it("sends nothing without a zone", async () => {
    const save = vi.fn(async (_zone: string) => saved);
    await createTimeZoneSync(save).sync(null);
    expect(save).not.toHaveBeenCalled();
  });
});
