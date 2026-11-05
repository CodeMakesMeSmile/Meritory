import type {
  AiProvider,
  FeedbackRequest,
  FeedbackResult,
} from "./provider.ts";

export function createMockProvider(model = "mock-1"): AiProvider {
  return {
    name: "mock",
    model,
    async feedback(request: FeedbackRequest): Promise<FeedbackResult> {
      const words = request.submission.trim().split(/\s+/).filter(Boolean);
      return {
        provider: "mock",
        model,
        summary: `Mock feedback for a ${words.length}-word submission.`,
        strengths: words.length > 0 ? ["Submission received."] : [],
        gaps:
          words.length < 50 ? ["Answer is short. Explain the tradeoffs."] : [],
        usage: { inputTokens: words.length, outputTokens: 0 },
      };
    },
  };
}
