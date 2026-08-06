import { cancelJobsForBook, cancelSupersededArtifactJobs, enqueueJob, requeueFailedJob } from "@/features/jobs/repositories/durable-job.repository";
import type { KnowledgeArtifactType } from "@/features/knowledge/types/knowledge";
import { jobConfig } from "@/lib/config/job.config";

export class JobService {
  public async cancelBookJobs(bookId: string, clerkId: string): Promise<void> { await cancelJobsForBook(bookId, clerkId); }
  public async enqueueBookProcessing(bookId: string, clerkId: string, recoveryKey?: string) {
    return enqueueJob({ type: "BOOK_PROCESSING", bookId, clerkId, idempotencyKey: recoveryKey ?? `book-processing:${bookId}`, maxAttempts: jobConfig.maxAttempts, checkpoint: { phase: "EXTRACTING" } });
  }

  public async enqueueKnowledgeGeneration(input: { bookId: string; clerkId: string; artifactId: string; artifactType: KnowledgeArtifactType; generationId: string; recoveryKey?: string }) {
    await cancelSupersededArtifactJobs(input.artifactId, input.generationId);
    const { recoveryKey, ...jobInput } = input;
    const idempotencyKey = recoveryKey ?? `knowledge-generation:${input.artifactId}:${input.generationId}`;
    await requeueFailedJob(idempotencyKey);
    return enqueueJob({ type: "KNOWLEDGE_GENERATION", ...jobInput, idempotencyKey, maxAttempts: jobConfig.maxAttempts, checkpoint: { phase: "GENERATING" } });
  }
}
