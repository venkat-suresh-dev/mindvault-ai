# Production checklist

## Before release

- [ ] Required production variables are configured and validated.
- [ ] Atlas vector-search index is queryable and matches the configured embedding dimensions.
- [ ] `npm run lint` and TypeScript checks pass.
- [ ] Production build completes in the deployment environment.
- [ ] Clerk production URLs and redirect settings are verified.
- [ ] Private Blob access is verified with both owner and non-owner accounts.
- [ ] Upstash rate-limit credentials are configured and a `429` response includes `Retry-After`.
- [ ] Sentry DSN is configured when error tracking is required and events contain no prompts, document text, Blob identifiers, tokens, or embeddings.
- [ ] Report-only CSP violations are reviewed before enforcing CSP.

## After release

- [ ] Verify upload processing reaches `READY` for a test PDF.
- [ ] Verify chat streams, persists conversation messages, and renders citations.
- [ ] Verify a knowledge artifact transitions through generation states.
- [ ] Review structured logs, Sentry error rate, rate-limit rejections, and provider failures.
- [ ] Confirm rollback target is available and deployment ownership is assigned.
- [ ] Verify `completedArtifact` remains available while a `KnowledgeGeneration` regenerates it.
- [ ] Verify cancellation stops later provider attempts and checkpoint resume avoids repeated completed batches.
- [ ] Verify provider-call and embedding-attempt usage records contain no source text, prompts, vectors, or secrets.
- [ ] Verify failed Blob deletion produces a durable cleanup record and a manual retry removes it.
- [ ] Confirm the one-job-per-Cron-invocation throughput is acceptable before enabling production workloads.
