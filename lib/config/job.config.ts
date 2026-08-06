import { getEnvironment } from "@/lib/config/env";

export const jobConfig = {
  leaseDurationMs: getEnvironment().JOB_LEASE_SECONDS * 1_000,
  maxAttempts: getEnvironment().JOB_MAX_ATTEMPTS,
  retryDelayMs: getEnvironment().JOB_RETRY_DELAY_SECONDS * 1_000,
  reconciliationStaleMs: getEnvironment().JOB_RECONCILIATION_STALE_SECONDS * 1_000,
} as const;
