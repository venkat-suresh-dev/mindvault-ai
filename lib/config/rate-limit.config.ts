import { getEnvironment } from "@/lib/config/env";

export type RateLimitPolicyName = "chat" | "upload" | "knowledge";

export interface RateLimitPolicy {
  limit: number;
  windowSeconds: number;
}

export function getRateLimitPolicy(name: RateLimitPolicyName): RateLimitPolicy {
  const environment = getEnvironment();
  switch (name) {
    case "chat":
      return { limit: environment.RATE_LIMIT_CHAT_MAX_REQUESTS, windowSeconds: environment.RATE_LIMIT_CHAT_WINDOW_SECONDS };
    case "upload":
      return { limit: environment.RATE_LIMIT_UPLOAD_MAX_REQUESTS, windowSeconds: environment.RATE_LIMIT_UPLOAD_WINDOW_SECONDS };
    case "knowledge":
      return { limit: environment.RATE_LIMIT_KNOWLEDGE_MAX_REQUESTS, windowSeconds: environment.RATE_LIMIT_KNOWLEDGE_WINDOW_SECONDS };
  }
}
