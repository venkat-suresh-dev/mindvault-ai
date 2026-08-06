# Environment

## Required in production

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB Atlas connection string. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk browser configuration. |
| `CLERK_SECRET_KEY` | Clerk server authentication. |
| `GOOGLE_GEMINI_API_KEY` | Gemini embeddings and generation provider. |
| `BLOB_READ_WRITE_TOKEN` | Server-side private Vercel Blob access. |
| `NEXT_PUBLIC_APP_URL` | Canonical HTTPS application URL. |
| `UPSTASH_REDIS_REST_URL` | Distributed rate-limit store endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Distributed rate-limit store credential. |
| `JOB_RUNNER_SECRET` | Secret used to authenticate the internal durable-job worker. |

## Optional

| Variable | Default | Purpose |
| --- | --- | --- |
| `SENTRY_DSN` | Disabled | Enables Sentry-compatible error events. |
| `SENTRY_ENVIRONMENT` | `NODE_ENV` | Error-tracking environment label. |
| `RATE_LIMIT_CHAT_MAX_REQUESTS` | `30` | Chat requests allowed per user and IP window. |
| `RATE_LIMIT_CHAT_WINDOW_SECONDS` | `60` | Chat rate-limit window. |
| `RATE_LIMIT_UPLOAD_MAX_REQUESTS` | `5` | Upload attempts allowed per user and IP window. |
| `RATE_LIMIT_UPLOAD_WINDOW_SECONDS` | `3600` | Upload rate-limit window. |
| `RATE_LIMIT_KNOWLEDGE_MAX_REQUESTS` | `5` | Knowledge generation requests allowed per user and IP window. |
| `RATE_LIMIT_KNOWLEDGE_WINDOW_SECONDS` | `600` | Knowledge generation rate-limit window. |
| `JOB_LEASE_SECONDS` | `300` | Durable worker lease duration. |
| `JOB_MAX_ATTEMPTS` | `3` | Maximum durable job attempts. |
| `JOB_RETRY_DELAY_SECONDS` | `60` | Delay before a retryable job is requeued. |

Production startup validates the required variables and valid rate-limit values. Secrets must be stored only in the deployment platform's secret manager; never commit them or expose them through `NEXT_PUBLIC_` variables.

## Client IP strategy

MindVault uses the IP component of rate limiting only on Vercel deployments, identified by Vercel's `VERCEL=1` runtime variable. In that environment it reads `x-vercel-forwarded-for`, which Vercel documents as its trusted client-address header. It never trusts client-provided `x-forwarded-for` or `x-real-ip` values. Other deployments use `unknown` for the IP dimension and continue to enforce the Clerk user-based rate limit; configure a platform-specific trusted proxy adapter before relying on IP limits elsewhere.
# Durable job worker

`JOB_RUNNER_SECRET` is required in production and must be supplied only to the server and trusted scheduler. `JOB_LEASE_SECONDS`, `JOB_MAX_ATTEMPTS`, `JOB_RETRY_DELAY_SECONDS`, and `JOB_RECONCILIATION_STALE_SECONDS` are optional server-only controls with defaults defined by `lib/config/env.ts`. No job record contains document text, prompts, embeddings, Blob keys, or other private source material.

Knowledge artifacts are stable completed output. Generation progress, retries, cancellation, and checkpoints are owned by `KnowledgeGeneration` and `KnowledgeGenerationBatch`; regenerating keeps the last completed artifact available. Provider-call usage records contain operational metadata only and never prompts, document text, vectors, or secrets.
