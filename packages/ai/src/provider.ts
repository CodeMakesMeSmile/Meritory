export interface FeedbackRequest {
  /** Idempotency key for the job that asked for feedback */
  requestId: string;
  promptVersion: string;
  rubricVersion: string;
  submission: string;
}

export interface FeedbackResult {
  provider: string;
  model: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  usage: { inputTokens: number; outputTokens: number };
}

/** Every model call goes through this, so providers can be swapped */
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  feedback(request: FeedbackRequest): Promise<FeedbackResult>;
}
