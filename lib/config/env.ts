import "server-only";

import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  VERCEL: z.string().optional(),
  MONGODB_URI: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().trim().min(1).optional(),
  CLERK_SECRET_KEY: z.string().trim().min(1).optional(),
  GOOGLE_GEMINI_API_KEY: z.string().trim().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().trim().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().trim().min(1).optional(),
  JOB_RUNNER_SECRET: z.string().trim().min(32).optional(),
  CRON_SECRET: z.string().trim().min(32).optional(),
  JOB_LEASE_SECONDS: z.coerce.number().int().min(30).max(3_600).default(300),
  JOB_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(3),
  JOB_RETRY_DELAY_SECONDS: z.coerce.number().int().min(1).max(86_400).default(60),
  JOB_RECONCILIATION_STALE_SECONDS: z.coerce.number().int().min(300).max(2_592_000).default(86_400),
  RATE_LIMIT_CHAT_MAX_REQUESTS: z.coerce.number().int().positive().max(10_000).default(30),
  RATE_LIMIT_CHAT_WINDOW_SECONDS: z.coerce.number().int().positive().max(86_400).default(60),
  RATE_LIMIT_UPLOAD_MAX_REQUESTS: z.coerce.number().int().positive().max(10_000).default(5),
  RATE_LIMIT_UPLOAD_WINDOW_SECONDS: z.coerce.number().int().positive().max(86_400).default(3_600),
  RATE_LIMIT_KNOWLEDGE_MAX_REQUESTS: z.coerce.number().int().positive().max(10_000).default(5),
  RATE_LIMIT_KNOWLEDGE_WINDOW_SECONDS: z.coerce.number().int().positive().max(86_400).default(600),
});

export type Environment = z.infer<typeof environmentSchema>;

let cachedEnvironment: Environment | undefined;

export function getEnvironment(): Environment {
  if (cachedEnvironment) return cachedEnvironment;
  const parsed = environmentSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Environment configuration contains invalid values.");
  }

  cachedEnvironment = parsed.data;
  return cachedEnvironment;
}

export function validateEnvironment(): void {
  const environment = getEnvironment();
  if (environment.NODE_ENV !== "production") return;

  const required: Array<keyof Environment> = [
    "MONGODB_URI",
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    "CLERK_SECRET_KEY",
    "GOOGLE_GEMINI_API_KEY",
    "BLOB_READ_WRITE_TOKEN",
    "NEXT_PUBLIC_APP_URL",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "JOB_RUNNER_SECRET",
    "CRON_SECRET",
  ];
  const missing = required.filter((key) => !environment[key]);
  if (missing.length > 0) {
    throw new Error(`Production environment is missing required configuration: ${missing.join(", ")}.`);
  }
}
