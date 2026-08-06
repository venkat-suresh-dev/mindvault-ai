import "server-only";

import { findStaleBooksForReconciliation } from "@/features/books/repositories/book.repository";
import { findStaleKnowledgeArtifactsForReconciliation } from "@/features/knowledge/repositories/knowledge-artifact.repository";
import { JobService } from "@/features/jobs/services/job.service";
import { jobConfig } from "@/lib/config/job.config";
import { log } from "@/lib/observability/logger";

export interface ReconciliationResult { scannedBooks: number; scannedArtifacts: number; queuedBookRecoveries: number; queuedKnowledgeRecoveries: number; skipped: number }

export class LegacyReconciliationService {
  public async reconcile(staleBefore = new Date(Date.now() - jobConfig.reconciliationStaleMs)): Promise<ReconciliationResult> {
    const [books, artifacts] = await Promise.all([findStaleBooksForReconciliation(staleBefore), findStaleKnowledgeArtifactsForReconciliation(staleBefore)]);
    const jobs = new JobService();
    let queuedBookRecoveries = 0;
    let queuedKnowledgeRecoveries = 0;
    let skipped = 0;
    for (const book of books) {
      if (!book.fileBlobKey || book.processingStatus === "UPLOADING") { skipped += 1; continue; }
      await jobs.enqueueBookProcessing(book._id.toString(), book.clerkId, `recovery:book:${book._id.toString()}:${book.updatedAt.toISOString()}`);
      queuedBookRecoveries += 1;
    }
    for (const artifact of artifacts) {
      await jobs.enqueueKnowledgeGeneration({ bookId: artifact.bookId.toString(), clerkId: artifact.clerkId, artifactId: artifact._id.toString(), artifactType: artifact.type, generationId: artifact.generationId, recoveryKey: `recovery:knowledge:${artifact._id.toString()}:${artifact.generationId}` });
      queuedKnowledgeRecoveries += 1;
    }
    const result = { scannedBooks: books.length, scannedArtifacts: artifacts.length, queuedBookRecoveries, queuedKnowledgeRecoveries, skipped };
    log("warn", "jobs.legacy_reconciliation.completed", result);
    return result;
  }
}
