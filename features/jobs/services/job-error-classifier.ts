import type { JobErrorClassification } from "@/features/jobs/types/durable-job";

export function classifyJobError(error: unknown): JobErrorClassification {
  if (!(error instanceof Error)) return "UNKNOWN";
  if (/lease was lost|cancelled/i.test(error.message)) return "CANCELLED";
  if (/provider-call budget exceeded/i.test(error.message)) return "VALIDATION";
  if (/timeout|timed out|abort/i.test(error.message)) return "TIMEOUT";
  if (/validation|invalid|no processed segments/i.test(error.message)) return "VALIDATION";
  if (/provider|gemini|network|unavailable|rate limit/i.test(error.message)) return "PROVIDER";
  return "TRANSIENT";
}
