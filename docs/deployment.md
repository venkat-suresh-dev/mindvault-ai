# Deployment

## Prerequisites

Provision MongoDB Atlas, Clerk, Gemini, private Vercel Blob storage, and an Upstash Redis database before deploying. Configure the Atlas vector-search index described in `docs/atlas-vector-search.md` and wait until it is queryable.

## Deployment process

1. Set every production variable listed in `docs/environment.md` in the deployment platform.
2. Run `npm run lint` and the TypeScript check used by CI.
3. Build the application with `npm run build`.
4. Deploy the application.
5. Verify sign-in, a protected PDF, chat, citation rendering, knowledge generation, and rate-limit responses with a non-production test account.
6. Review Sentry and structured logs for deployment errors before promoting traffic.

## Rollback

Roll back to the last known-good application deployment when a release causes user-facing failures. Do not roll back MongoDB schema or Atlas index changes without a separately reviewed data migration plan. Preserve Sentry events and logs from the failed release, then validate protected file access and ownership checks after rollback.

## Post-deployment verification

Confirm the application starts without environment-validation errors, rate-limit storage is reachable, private Blob access remains authenticated, and the Atlas index serves book-scoped queries. Review application error rate and generation failure rate during the initial release window.
# Durable worker deployment

Knowledge generation and book processing are executed by the internal durable-job worker. Set `JOB_RUNNER_SECRET` to a randomly generated value of at least 32 characters in every production deployment. The worker endpoint (`/api/internal/jobs/run`) accepts only a `Bearer` credential matching this secret with a constant-time comparison; it does not use Clerk and must never be exposed as a public user API.

`vercel.json` schedules the endpoint every minute. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; set `CRON_SECRET` alongside `JOB_RUNNER_SECRET` in production. The route accepts either secret, allowing local/manual invocation with the dedicated worker secret while production Cron uses its supported credential. Deploy the application code and set both secrets before enabling the schedule. Disable the schedule first when rolling back; queued jobs remain durable in MongoDB and can be resumed after the previous compatible worker is restored.

For local development, run `npm run dev` in one terminal and `npm run worker` in another after setting the same `JOB_RUNNER_SECRET` in `.env.local`. The local command calls the protected internal worker route and therefore exercises the production claim/lease/handler flow without duplicating worker logic. Run it once per queued job; production continues to use Vercel Cron.

Create the durable-job indexes declared in `features/jobs/models/durable-job.model.ts` through the normal MongoDB migration/deployment process before enabling workers: unique `idempotencyKey`, `{ status: 1, nextRunAt: 1, leaseExpiresAt: 1 }`, `{ bookId: 1, clerkId: 1, type: 1 }`, and `{ artifactId: 1, generationId: 1 }`.

Knowledge lifecycle migrations must also create the `KnowledgeGeneration` unique generation index over `{ userId, bookId, artifactType, generationId }` and its partial unique active-generation index over `{ userId, bookId, artifactType }`. `KnowledgeGenerationBatch` has both its lifecycle-scoped unique index over `{ clerkId, bookId, artifactType, generationId, batchIndex }` and its artifact-identity unique index over `{ artifactId, generationId, batchIndex }`; both protect a resumable batch from duplicate persistence. `AiUsage.idempotencyKey` is unique, and `BlobCleanup` has a unique ownership lookup index over `{ bookId, clerkId, blobKey }`. The current Cron worker claims at most one job per invocation; it is not a continuously draining queue worker.

For failed or stale work, inspect durable-job records by status, error classification, and retry count. Expired leases are safely reclaimed by a worker; jobs at their attempt limit are terminally failed and require an explicit operator retry after the underlying cause is fixed. Never edit a running lease by hand. To reconcile legacy records, an operator may call `POST /api/internal/jobs/reconcile` with the worker bearer secret. It only evaluates records older than `JOB_RECONCILIATION_STALE_SECONDS`, never touches completed records, skips `UPLOADING` books, and idempotently queues eligible processing or knowledge work using existing identifiers. Validate the reported count and storage availability before invoking it; this endpoint is not scheduled automatically.
