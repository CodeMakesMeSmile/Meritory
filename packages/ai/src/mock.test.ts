import { describe, expect, it } from "vitest";
import { createProvider, readAiConfig } from "./config.ts";
import { createMockProvider } from "./mock.ts";

const request = {
  requestId: "req-1",
  promptVersion: "p1",
  rubricVersion: "r1",
  submission: "Use a queue between the API and the worker.",
};

describe("mock provider", () => {
  it("returns the same feedback for the same request", async () => {
    const provider = createMockProvider();
    expect(await provider.feedback(request)).toEqual(
      await provider.feedback(request),
    );
  });

  it("defaults to the mock provider with the model id from config", () => {
    const config = readAiConfig({});
    expect(config).toEqual({ provider: "mock", model: "claude-haiku-5-5" });
    expect(createProvider(config).name).toBe("mock");
  });

  it("rejects an unknown provider", () => {
    expect(() => createProvider({ provider: "other", model: "x" })).toThrow(
      /Unknown AI_PROVIDER/,
    );
  });
});
