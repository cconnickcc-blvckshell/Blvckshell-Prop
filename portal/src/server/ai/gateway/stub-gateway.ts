import type { AiCompletionRequest, AiCompletionResult, AiGateway } from "./types";

/** Placeholder until a provider adapter is wired (Phase 1). */
export class StubAiGateway implements AiGateway {
  async complete(_request: AiCompletionRequest): Promise<AiCompletionResult> {
    return {
      ok: false,
      error: "AI gateway not configured (Phase 1 stub)",
      retryable: false,
    };
  }
}
