import { beforeEach, describe, expect, it, vi } from "vitest";

const generationCalls = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock("@/lib/observability/logger", () => ({ log: vi.fn() }));
vi.mock("@google/genai", () => ({ GoogleGenAI: class { public models = { generateContent: generationCalls, generateContentStream: vi.fn() }; } }));
vi.mock("@/lib/config/ai.config", () => ({ assertGenerationConfiguration: vi.fn(), aiConfig: { gemini: { apiKey: "test" }, generation: { primaryModel: "primary", fallbackModel: "fallback", maxRetries: 0, requestTimeoutMs: 10, retryBaseDelayMs: 1, retryMaxDelayMs: 1 } } }));

import { GeminiChatProvider } from "./gemini-chat-provider";

describe("GeminiChatProvider cancellation", () => {
  beforeEach(() => vi.clearAllMocks());
  it("propagates caller cancellation to Gemini", async () => {
    generationCalls.mockResolvedValueOnce({ text: "ok" });
    const controller = new AbortController();
    await new GeminiChatProvider().generate({ prompt: "safe prompt", signal: controller.signal });
    const signal = generationCalls.mock.calls[0][0].config.abortSignal as AbortSignal;
    controller.abort();
    expect(signal.aborted).toBe(true);
  });

  it("aborts the provider operation on timeout", async () => {
    vi.useFakeTimers();
    let providerSignal: AbortSignal | undefined;
    generationCalls.mockImplementationOnce(({ config }: { config: { abortSignal: AbortSignal } }) => {
      providerSignal = config.abortSignal;
      return new Promise(() => undefined);
    });
    const promise = new GeminiChatProvider().generate({ prompt: "safe prompt" });
    const expectation = expect(promise).rejects.toThrow("unavailable");
    await vi.advanceTimersByTimeAsync(10);
    await expectation;
    expect(providerSignal?.aborted).toBe(true);
    vi.useRealTimers();
  });

  it("counts primary retries and fallback attempts through the raw attempt hook", async () => {
    generationCalls.mockRejectedValueOnce(Object.assign(new Error("unavailable"), { code: 503 })).mockResolvedValueOnce({ text: "fallback response" });
    const attempts: string[] = [];
    await expect(new GeminiChatProvider().generate({ prompt: "safe prompt", onAttempt: (model) => { attempts.push(model); } })).resolves.toBe("fallback response");
    expect(attempts).toEqual(["primary", "fallback"]);
  });

  it("does not call Gemini when the persisted budget hook rejects an attempt", async () => {
    const onAttempt = vi.fn(() => { throw new Error("Generation provider-call budget exceeded."); });
    await expect(new GeminiChatProvider().generate({ prompt: "safe prompt", onAttempt })).rejects.toThrow("unavailable");
    expect(generationCalls).not.toHaveBeenCalled();
    expect(onAttempt).toHaveBeenCalledTimes(2);
  });
});
