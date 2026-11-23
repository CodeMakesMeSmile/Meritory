import { describe, expect, it, vi } from "vitest";
import { retryingLoader } from "./password-rules.ts";

describe("retryingLoader", () => {
  it("tries again after a failed load", async () => {
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValue("rules");
    const loadRules = retryingLoader(load);
    await expect(loadRules()).rejects.toThrow("Failed to fetch");
    await expect(loadRules()).resolves.toBe("rules");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("loads once when it works", async () => {
    const load = vi.fn(async () => "rules");
    const loadRules = retryingLoader(load);
    await Promise.all([loadRules(), loadRules()]);
    await loadRules();
    expect(load).toHaveBeenCalledTimes(1);
  });
});
