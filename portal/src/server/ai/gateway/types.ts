/** Provider-agnostic AI gateway contracts (Phase 1 — no production agent rollout yet). */

export type AiPersona = "BLAIR" | "ALICE" | "CLARA" | "SYSTEM";

export type AiMessagePart =
  | { type: "text"; text: string }
  | { type: "image"; mimeType: string; base64: string };

export type AiCompletionRequest = {
  persona: AiPersona;
  modelTier: "fast" | "multimodal" | "reasoning";
  messages: { role: "user" | "system"; parts: AiMessagePart[] }[];
  jsonSchema?: Record<string, unknown>;
  tools?: string[];
  maxOutputTokens?: number;
  idempotencyKey?: string;
};

export type AiCompletionResult =
  | { ok: true; text: string; json?: unknown; usage: { inputTokens: number; outputTokens: number }; provider: string; model: string }
  | { ok: false; error: string; retryable: boolean };

export interface AiGateway {
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}
