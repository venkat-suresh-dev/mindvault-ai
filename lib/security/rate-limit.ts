import "server-only";

import { getEnvironment } from "@/lib/config/env";
import { getRateLimitPolicy, type RateLimitPolicyName } from "@/lib/config/rate-limit.config";
import type { RequestContext } from "@/lib/security/request-context";
import { log, safeErrorMetadata } from "@/lib/observability/logger";
import { captureException } from "@/lib/observability/telemetry";

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

interface RateLimitStore {
  increment(key: string, windowSeconds: number): Promise<number>;
}

class UpstashRateLimitStore implements RateLimitStore {
  public async increment(key: string, windowSeconds: number): Promise<number> {
    const environment = getEnvironment();
    const response = await fetch(`${environment.UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${environment.UPSTASH_REDIS_REST_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", key], ["EXPIRE", key, windowSeconds, "NX"]]),
    });
    if (!response.ok) throw new Error("Rate limit store request failed.");
    const payload: unknown = await response.json();
    if (!Array.isArray(payload) || typeof payload[0] !== "object" || payload[0] === null || !("result" in payload[0])) {
      throw new Error("Rate limit store returned an invalid response.");
    }
    const result = Reflect.get(payload[0], "result");
    if (typeof result !== "number") throw new Error("Rate limit store returned an invalid counter.");
    return result;
  }
}

class MemoryRateLimitStore implements RateLimitStore {
  private readonly values = new Map<string, { count: number; expiresAt: number }>();

  public async increment(key: string, windowSeconds: number): Promise<number> {
    const now = Date.now();
    const current = this.values.get(key);
    if (!current || current.expiresAt <= now) {
      this.values.set(key, { count: 1, expiresAt: now + windowSeconds * 1_000 });
      return 1;
    }
    current.count += 1;
    return current.count;
  }
}

const memoryStore = new MemoryRateLimitStore();

export async function enforceRateLimit(policyName: RateLimitPolicyName, context: RequestContext): Promise<RateLimitResult> {
  const policy = getRateLimitPolicy(policyName);
  const environment = getEnvironment();
  const store = environment.UPSTASH_REDIS_REST_URL && environment.UPSTASH_REDIS_REST_TOKEN
    ? new UpstashRateLimitStore()
    : memoryStore;
  const window = Math.floor(Date.now() / (policy.windowSeconds * 1_000));
  let values: number[];
  try {
    values = await Promise.all([
      store.increment(`mindvault:rate-limit:${policyName}:user:${context.clerkId}:${window}`, policy.windowSeconds),
      store.increment(`mindvault:rate-limit:${policyName}:ip:${context.ipAddress}:${window}`, policy.windowSeconds),
    ]);
  } catch (error) {
    log("error", "rate_limit.enforcement.failed", { policy: policyName, ...safeErrorMetadata(error) });
    await captureException(error, { operation: "rate-limit", policy: policyName });
    throw error;
  }
  return {
    allowed: values.every((value) => value <= policy.limit),
    retryAfterSeconds: policy.windowSeconds - Math.floor((Date.now() / 1_000) % policy.windowSeconds),
  };
}
