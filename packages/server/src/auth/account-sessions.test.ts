import { describe, expect, it } from "vitest";
import {
  CONFIRM_MAX_AGE_MS,
  deviceLabel,
  isFresh,
} from "./account-sessions.ts";

describe("deviceLabel", () => {
  it.each([
    [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
      "Chrome on Windows",
    ],
    [
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0",
      "Firefox on macOS",
    ],
    [
      "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Mobile Safari/537.36",
      "Chrome on Android",
    ],
    [
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
      "Safari on iOS",
    ],
  ])("names %s", (userAgent, label) => {
    expect(deviceLabel(userAgent)).toBe(label);
  });

  it("says so when there's no user agent", () => {
    expect(deviceLabel(null)).toBe("Unknown device");
    expect(deviceLabel("")).toBe("Unknown device");
  });

  it("names the phone app by its own user agent", () => {
    expect(deviceLabel("Meritory/1.0 (Android 15)")).toBe(
      "Meritory app on Android",
    );
  });

  it("says so when it can't read the user agent", () => {
    expect(deviceLabel("curl/8.10.1")).toBe("Unknown device");
    expect(deviceLabel("okhttp/4.12.0")).toBe("Unknown device");
  });
});

describe("isFresh", () => {
  const now = Date.parse("2026-11-07T12:00:00Z");
  const ago = (ms: number) => new Date(now - ms);

  it("is fresh for a day after sign-in", () => {
    expect(isFresh({ createdAt: ago(CONFIRM_MAX_AGE_MS - 1000) }, now)).toBe(
      true,
    );
    expect(isFresh({ createdAt: ago(CONFIRM_MAX_AGE_MS) }, now)).toBe(false);
  });

  it("counts a typed password as a fresh sign-in", () => {
    expect(
      isFresh(
        { createdAt: ago(3 * CONFIRM_MAX_AGE_MS), confirmedAt: ago(1000) },
        now,
      ),
    ).toBe(true);
    expect(
      isFresh(
        {
          createdAt: ago(3 * CONFIRM_MAX_AGE_MS),
          confirmedAt: ago(CONFIRM_MAX_AGE_MS),
        },
        now,
      ),
    ).toBe(false);
  });
});
