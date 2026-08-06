import { DurableJobModel } from "@/features/jobs/models/durable-job.model";
import type { DurableJobCheckpoint, DurableJobType, JobErrorClassification } from "@/features/jobs/types/durable-job";
import { connectToDatabase } from "@/lib/db/connection";

export interface EnqueueJobInput { type: DurableJobType; bookId: string; clerkId: string; artifactId?: string; artifactType?: string; generationId?: string; idempotencyKey: string; maxAttempts: number; checkpoint?: DurableJobCheckpoint }

export async function enqueueJob(input: EnqueueJobInput) {
  await connectToDatabase();
  return DurableJobModel.findOneAndUpdate(
    { idempotencyKey: input.idempotencyKey },
    { $setOnInsert: { ...input, status: "QUEUED", nextRunAt: new Date(), queuedAt: new Date(), checkpoint: input.checkpoint ?? {} } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
}

export async function requeueFailedJob(idempotencyKey: string): Promise<boolean> {
  await connectToDatabase();
  const result = await DurableJobModel.updateOne(
    { idempotencyKey, status: "FAILED" },
    {
      $set: {
        status: "QUEUED",
        attemptCount: 0,
        nextRunAt: new Date(),
        queuedAt: new Date(),
      },
      $unset: {
        leaseOwner: 1,
        leaseExpiresAt: 1,
        heartbeatAt: 1,
        startedAt: 1,
        completedAt: 1,
        failedAt: 1,
        errorClassification: 1,
      },
    },
  );
  return result.modifiedCount === 1;
}

export async function claimDueJob(leaseOwner: string, leaseDurationMs: number) {
  await connectToDatabase();
  const now = new Date();
  return DurableJobModel.findOneAndUpdate(
    { status: "QUEUED", nextRunAt: { $lte: now } },
    { $set: { status: "RUNNING", leaseOwner, leaseExpiresAt: new Date(now.getTime() + leaseDurationMs), heartbeatAt: now, startedAt: now }, $inc: { attemptCount: 1 } },
    { sort: { nextRunAt: 1, createdAt: 1 }, returnDocument: "after" },
  ).lean();
}

export async function countActiveKnowledgeJobs(clerkId: string): Promise<number> {
  await connectToDatabase();
  return DurableJobModel.countDocuments({ clerkId, type: "KNOWLEDGE_GENERATION", status: { $in: ["QUEUED", "RUNNING"] } });
}

export async function getJobCheckpoint(jobId: string): Promise<DurableJobCheckpoint> {
  await connectToDatabase();
  const job = await DurableJobModel.findById(jobId).select({ checkpoint: 1 }).lean();
  return {
    phase: job?.checkpoint.phase ?? undefined,
    nextSegmentIndex: job?.checkpoint.nextSegmentIndex ?? undefined,
    lastProcessedPage: job?.checkpoint.lastProcessedPage ?? undefined,
    completedBatches: job?.checkpoint.completedBatches ?? undefined,
    totalBatches: job?.checkpoint.totalBatches ?? undefined,
    providerCallCount: job?.checkpoint.providerCallCount ?? undefined,
  };
}

export async function heartbeatJob(jobId: string, leaseOwner: string, leaseDurationMs: number): Promise<boolean> {
  await connectToDatabase();
  const now = new Date();
  const result = await DurableJobModel.updateOne({ _id: jobId, status: "RUNNING", leaseOwner, leaseExpiresAt: { $gt: now } }, { $set: { heartbeatAt: now, leaseExpiresAt: new Date(now.getTime() + leaseDurationMs) } });
  return result.modifiedCount === 1;
}

export async function completeJob(jobId: string, leaseOwner: string): Promise<boolean> {
  await connectToDatabase();
  const result = await DurableJobModel.updateOne({ _id: jobId, status: "RUNNING", leaseOwner }, { $set: { status: "COMPLETED", completedAt: new Date() }, $unset: { leaseOwner: 1, leaseExpiresAt: 1 } });
  return result.modifiedCount === 1;
}

export async function checkpointJob(jobId: string, leaseOwner: string, checkpoint: DurableJobCheckpoint): Promise<boolean> {
  await connectToDatabase();
  const result = await DurableJobModel.updateOne({ _id: jobId, status: "RUNNING", leaseOwner }, { $set: { checkpoint } });
  return result.modifiedCount === 1;
}

export async function cancelJob(jobId: string, clerkId: string): Promise<boolean> {
  await connectToDatabase();
  const result = await DurableJobModel.updateOne({ _id: jobId, clerkId, status: { $in: ["QUEUED", "RUNNING"] } }, { $set: { status: "CANCELLED", cancelledAt: new Date() }, $unset: { leaseOwner: 1, leaseExpiresAt: 1 } });
  return result.modifiedCount === 1;
}

export async function cancelSupersededArtifactJobs(artifactId: string, generationId: string): Promise<void> {
  await connectToDatabase();
  await DurableJobModel.updateMany(
    { artifactId, type: "KNOWLEDGE_GENERATION", generationId: { $ne: generationId }, status: { $in: ["QUEUED", "RUNNING"] } },
    { $set: { status: "CANCELLED", cancelledAt: new Date(), errorClassification: "CANCELLED" }, $unset: { leaseOwner: 1, leaseExpiresAt: 1 } },
  );
}

export async function cancelJobsForBook(bookId: string, clerkId: string): Promise<void> {
  await connectToDatabase();
  await DurableJobModel.updateMany(
    { bookId, clerkId, status: { $in: ["QUEUED", "RUNNING"] } },
    { $set: { status: "CANCELLED", cancelledAt: new Date(), errorClassification: "CANCELLED" }, $unset: { leaseOwner: 1, leaseExpiresAt: 1 } },
  );
}

export async function deleteJobsForBook(bookId: string, clerkId: string): Promise<void> {
  await connectToDatabase();
  await DurableJobModel.deleteMany({ bookId, clerkId, status: { $in: ["QUEUED", "CANCELLED", "COMPLETED", "FAILED"] } });
}

export type JobFailureDisposition = "RETRY_SCHEDULED" | "TERMINAL" | "NOT_OWNED";

export async function failOrRetryJob(jobId: string, leaseOwner: string, maxAttempts: number, classification: JobErrorClassification, retryDelayMs: number): Promise<JobFailureDisposition> {
  await connectToDatabase();
  const job = await DurableJobModel.findOne({ _id: jobId, status: "RUNNING", leaseOwner }).lean();
  if (!job) return "NOT_OWNED";
  const terminal = job.attemptCount >= maxAttempts || classification === "VALIDATION" || classification === "CANCELLED";
  const result = await DurableJobModel.updateOne({ _id: jobId, status: "RUNNING", leaseOwner }, terminal
    ? { $set: { status: classification === "CANCELLED" ? "CANCELLED" : "FAILED", errorClassification: classification, failedAt: new Date() }, $unset: { leaseOwner: 1, leaseExpiresAt: 1 } }
    : { $set: { status: "QUEUED", errorClassification: classification, nextRunAt: new Date(Date.now() + retryDelayMs) }, $unset: { leaseOwner: 1, leaseExpiresAt: 1 } });
  if (result.modifiedCount !== 1) return "NOT_OWNED";
  return terminal ? "TERMINAL" : "RETRY_SCHEDULED";
}

export async function recoverExpiredLeases(maxAttempts: number): Promise<number> {
  await connectToDatabase();
  const jobs = await DurableJobModel.find({ status: "RUNNING", leaseExpiresAt: { $lt: new Date() } }).select({ _id: 1, attemptCount: 1 }).limit(100).lean();
  let recovered = 0;
  for (const job of jobs) {
    const status = job.attemptCount >= maxAttempts ? "FAILED" : "QUEUED";
    const result = await DurableJobModel.updateOne({ _id: job._id, status: "RUNNING", leaseExpiresAt: { $lt: new Date() } }, { $set: status === "FAILED" ? { status, failedAt: new Date(), errorClassification: "TIMEOUT" } : { status, nextRunAt: new Date(), errorClassification: "TIMEOUT" }, $unset: { leaseOwner: 1, leaseExpiresAt: 1 } });
    recovered += result.modifiedCount;
  }
  return recovered;
}
