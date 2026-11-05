import { createMockProvider } from "./mock.ts";
import type { AiProvider } from "./provider.ts";

export interface AiConfig {
  provider: string;
  model: string;
}

export function readAiConfig(
  env: Record<string, string | undefined>,
): AiConfig {
  return {
    provider: env.AI_PROVIDER || "mock",
    model: env.AI_MODEL || "claude-haiku-5-5",
  };
}

export function createProvider(config: AiConfig): AiProvider {
  switch (config.provider) {
    case "mock":
      return createMockProvider();
    // TODO: add the Anthropic adapter
    default:
      throw new Error(`Unknown AI_PROVIDER "${config.provider}"`);
  }
}
