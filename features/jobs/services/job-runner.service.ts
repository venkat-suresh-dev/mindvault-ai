import "server-only";

import { classifyJobError } from "@/features/jobs/services/job-error-classifier";
import { checkpointJob, claimDueJob, completeJob, failOrRetryJob, getJobCheckpoint, heartbeatJob, recoverExpiredLeases } from "@/features/jobs/repositories/durable-job.repository";
import { recordAiUsage } from "@/features/knowledge/repositories/ai-usage.repository";
import { jobConfig } from "@/lib/config/job.config";
import { log, safeErrorMetadata } from "@/lib/observability/logger";
import type { DurableJobCheckpoint } from "@/features/jobs/types/durable-job";

export class JobRunnerService {
  public async runOnce(workerId: string): Promise<boolean> {
    await recoverExpiredLeases(jobConfig.maxAttempts);
    const job = await claimDueJob(workerId, jobConfig.leaseDurationMs);
    if (!job) return false;
    const jobId = job._id.toString();
    const startedAt = Date.now();
    const cancellation = new AbortController();
    const assertLease = async () => {
      if (cancellation.signal.aborted || !(await heartbeatJob(jobId, workerId, jobConfig.leaseDurationMs))) {
        cancellation.abort();
        throw new Error("Job lease was lost or cancelled.");
      }
    };
    const initialCheckpoint = { phase: job.checkpoint.phase ?? undefined, nextSegmentIndex: job.checkpoint.nextSegmentIndex ?? undefined, lastProcessedPage: job.checkpoint.lastProcessedPage ?? undefined, completedBatches: job.checkpoint.completedBatches ?? undefined, totalBatches: job.checkpoint.totalBatches ?? undefined };
    const saveCheckpoint = async (checkpoint: DurableJobCheckpoint) => {
      await assertLease();
      if (!(await checkpointJob(jobId, workerId, checkpoint))) throw new Error("Job lease was lost before checkpointing.");
    };
    try {
      await assertLease();
      if (job.type === "BOOK_PROCESSING") {
        const { BookJobHandler } = await import("@/features/books/services/book-job-handler.service");
        await new BookJobHandler().run(job.bookId.toString(), job.clerkId, assertLease, cancellation.signal, initialCheckpoint, saveCheckpoint);
      } else {
        const { GenerationOrchestratorService } = await import("@/features/knowledge/services/generation-orchestrator.service");
        const { findKnowledgeGeneration } = await import("@/features/knowledge/repositories/knowledge-generation.repository");
        if (!job.artifactId || !job.artifactType || !job.generationId) throw new Error("Knowledge job is incomplete.");
        const generation = await findKnowledgeGeneration({ userId: job.clerkId, bookId: job.bookId.toString(), artifactType: job.artifactType, generationId: job.generationId });
        if (!generation || generation.status === "CANCELLED" || generation.status === "FAILED" || generation.status === "COMPLETED") {
          if (!(await completeJob(jobId, workerId))) throw new Error("Job lease was lost before completion.");
          return true;
        }
        await new GenerationOrchestratorService().runQueuedGeneration(
          job.bookId.toString(),
          job.clerkId,
          job.artifactType,
          job.artifactId.toString(),
          job.generationId,
          assertLease,
          cancellation.signal,
          initialCheckpoint,
          saveCheckpoint,
        );
      }
      if (!(await completeJob(jobId, workerId))) throw new Error("Job lease was lost before completion.");
      if (job.type === "KNOWLEDGE_GENERATION") {
        const checkpoint = await getJobCheckpoint(jobId);
        await recordAiUsage({ generationId: job.generationId!, userId: job.clerkId, bookId: job.bookId.toString(), artifactType: job.artifactType ?? undefined, provider: "gemini", model: "gemini-3.5-flash", operation: "GENERATION", durationMs: Date.now() - startedAt, success: true, retryCount: Math.max(0, job.attemptCount - 1), providerCallNumber: checkpoint.providerCallCount ?? 0 });
        log("info", "ai.generation.usage", { generationId: job.generationId, artifactType: job.artifactType, provider: "gemini", model: "gemini-3.5-flash", durationMs: Date.now() - startedAt, success: true, retryCount: Math.max(0, job.attemptCount - 1), tokenUsage: "unavailable" });
      }
      return true;
    } catch (error) {
      cancellation.abort();
      const classification = classifyJobError(error);
      const disposition = await failOrRetryJob(jobId, workerId, jobConfig.maxAttempts, classification, jobConfig.retryDelayMs);
      if (job.type === "KNOWLEDGE_GENERATION" && job.artifactType && job.generationId && disposition !== "NOT_OWNED") {
        const { GenerationOrchestratorService } = await import("@/features/knowledge/services/generation-orchestrator.service");
        const lifecycle = new GenerationOrchestratorService();
        if (classification === "CANCELLED") await lifecycle.markCancelled(job.bookId.toString(), job.clerkId, job.artifactType, job.generationId);
        else if (disposition === "RETRY_SCHEDULED") await lifecycle.markRetrying(job.bookId.toString(), job.clerkId, job.artifactType, job.generationId);
        else await lifecycle.markFailed(job.bookId.toString(), job.clerkId, job.artifactType, job.generationId);
      }
      if (job.type === "KNOWLEDGE_GENERATION") {
        const checkpoint = await getJobCheckpoint(jobId);
        await recordAiUsage({ generationId: job.generationId!, userId: job.clerkId, bookId: job.bookId.toString(), artifactType: job.artifactType ?? undefined, provider: "gemini", model: "gemini-3.5-flash", operation: "GENERATION", durationMs: Date.now() - startedAt, success: false, errorClassification: classification, retryCount: Math.max(0, job.attemptCount - 1), providerCallNumber: checkpoint.providerCallCount ?? 0 });
        log("warn", "ai.generation.usage", { generationId: job.generationId, artifactType: job.artifactType, provider: "gemini", model: "gemini-3.5-flash", durationMs: Date.now() - startedAt, success: false, retryCount: Math.max(0, job.attemptCount - 1), tokenUsage: "unavailable", retryScheduled: disposition === "RETRY_SCHEDULED" });
      }
      log("error", "job.execution.failed", { jobType: job.type, ...safeErrorMetadata(error) });
      return true;
    }
  }
}
