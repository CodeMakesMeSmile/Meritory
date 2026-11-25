import { describe, expect, it } from "vitest";
import { parseWebOrigin } from "./web-origin.ts";

describe("parseWebOrigin", () => {
  it.each([
    ["https://meritory.app", "https://meritory.app"],
    ["https://meritory.app/", "https://meritory.app"],
    ["https://meritory.app/api/v1?x=1#top", "https://meritory.app"],
    ["https://example.test:8443/", "https://example.test:8443"],
    [" HTTPS://Meritory.App ", "https://meritory.app"],
  ])("reads %j as %j", (value, origin) => {
    expect(parseWebOrigin(value, false)).toBe(origin);
  });

  it("allows http only in development", () => {
    expect(parseWebOrigin("http://10.0.2.2:3001/", true)).toBe(
      "http://10.0.2.2:3001",
    );
    expect(() => parseWebOrigin("http://10.0.2.2:3001", false)).toThrow(
      'EXPO_PUBLIC_WEB_ORIGIN must start with https://, but is "http://10.0.2.2:3001".',
    );
  });

  it.each([["meritory.app"], ["//meritory.app"], ["not a url"], [""]])(
    "rejects %j, which is not a URL",
    (value) => {
      expect(() => parseWebOrigin(value, true)).toThrow(
        `EXPO_PUBLIC_WEB_ORIGIN is not a URL: "${value}".`,
      );
    },
  );

  it.each([
    ["app.meritory.mobile://"],
    ["ftp://meritory.app"],
    ["javascript:alert(1)"],
  ])("rejects %j, which is not a website", (value) => {
    expect(() => parseWebOrigin(value, true)).toThrow(
      "must start with https:// or http://",
    );
    expect(() => parseWebOrigin(value, false)).toThrow(
      "must start with https://,",
    );
  });
});
