import type { KnowledgeArtifactType } from "@/features/knowledge/types/knowledge";

export const DURABLE_JOB_TYPES = ["BOOK_PROCESSING", "KNOWLEDGE_GENERATION"] as const;
export type DurableJobType = (typeof DURABLE_JOB_TYPES)[number];
export const DURABLE_JOB_STATUSES = ["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"] as const;
export type DurableJobStatus = (typeof DURABLE_JOB_STATUSES)[number];
export const JOB_ERROR_CLASSIFICATIONS = ["TRANSIENT", "PROVIDER", "TIMEOUT", "VALIDATION", "CANCELLED", "UNKNOWN"] as const;
export type JobErrorClassification = (typeof JOB_ERROR_CLASSIFICATIONS)[number];

export interface DurableJobCheckpoint {
  phase?: "EXTRACTING" | "CHUNKING" | "EMBEDDING" | "GENERATING";
  nextSegmentIndex?: number;
  lastProcessedPage?: number;
  completedBatches?: number;
  totalBatches?: number;
  providerCallCount?: number;
}

export interface DurableJobRecord {
  id: string;
  type: DurableJobType;
  status: DurableJobStatus;
  bookId: string;
  clerkId: string;
  artifactId?: string;
  artifactType?: KnowledgeArtifactType;
  generationId?: string;
  idempotencyKey: string;
  attemptCount: number;
  maxAttempts: number;
  nextRunAt: string;
  leaseOwner?: string;
  leaseExpiresAt?: string;
  heartbeatAt?: string;
  checkpoint: DurableJobCheckpoint;
  errorClassification?: JobErrorClassification;
}
