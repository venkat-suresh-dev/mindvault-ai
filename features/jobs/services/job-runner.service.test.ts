import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ recover: vi.fn(), claim: vi.fn(), heartbeat: vi.fn(), checkpoint: vi.fn(), complete: vi.fn(), fail: vi.fn(), runBook: vi.fn(), log: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/features/jobs/services/job-error-classifier", () => ({ classifyJobError: () => "TRANSIENT" }));
vi.mock("@/lib/config/job.config", () => ({ jobConfig: { maxAttempts: 3, leaseDurationMs: 1_000, retryDelayMs: 1_000 } }));
vi.mock("@/features/jobs/repositories/durable-job.repository", () => ({ recoverExpiredLeases: mocks.recover, claimDueJob: mocks.claim, heartbeatJob: mocks.heartbeat, checkpointJob: mocks.checkpoint, completeJob: mocks.complete, failOrRetryJob: mocks.fail, getJobCheckpoint: vi.fn().mockResolvedValue({}) }));
vi.mock("@/features/knowledge/repositories/ai-usage.repository", () => ({ recordAiUsage: vi.fn() }));
vi.mock("@/features/books/services/book-job-handler.service", () => ({ BookJobHandler: class { run = mocks.runBook; } }));
vi.mock("@/lib/observability/logger", () => ({ log: mocks.log, safeErrorMetadata: () => ({}) }));

import { JobRunnerService } from "./job-runner.service";

const job = { _id: { toString: () => "job-1" }, type: "BOOK_PROCESSING", bookId: { toString: () => "book-1" }, clerkId: "user", checkpoint: {}, attemptCount: 1 };

describe("JobRunnerService", () => {
  beforeEach(() => vi.clearAllMocks());
  it("completes a claimed job with an owned lease", async () => {
    mocks.claim.mockResolvedValue(job); mocks.heartbeat.mockResolvedValue(true); mocks.complete.mockResolvedValue(true);
    await expect(new JobRunnerService().runOnce("worker")).resolves.toBe(true);
    expect(mocks.runBook).toHaveBeenCalledOnce();
    expect(mocks.complete).toHaveBeenCalledWith("job-1", "worker");
  });
  it("does not complete after lease loss and schedules failure handling", async () => {
    mocks.claim.mockResolvedValue(job); mocks.heartbeat.mockResolvedValue(false); mocks.fail.mockResolvedValue(true);
    await new JobRunnerService().runOnce("worker");
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(mocks.fail).toHaveBeenCalled();
  });
  it("classifies a transient handler failure for retry without completion", async () => {
    mocks.claim.mockResolvedValue(job); mocks.heartbeat.mockResolvedValue(true); mocks.runBook.mockRejectedValueOnce(new Error("network timeout")); mocks.fail.mockResolvedValue(true);
    await new JobRunnerService().runOnce("worker");
    expect(mocks.fail).toHaveBeenCalledWith("job-1", "worker", 3, "TRANSIENT", 1_000);
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("cannot complete when completion fencing rejects a stale worker", async () => {
    mocks.claim.mockResolvedValue(job); mocks.heartbeat.mockResolvedValue(true); mocks.complete.mockResolvedValue(false); mocks.fail.mockResolvedValue(false);
    await new JobRunnerService().runOnce("worker");
    expect(mocks.complete).toHaveBeenCalledWith("job-1", "worker");
    expect(mocks.fail).toHaveBeenCalled();
  });
  it("does not execute a queued job that was cancelled before claiming", async () => {
    mocks.claim.mockResolvedValue(null);
    await expect(new JobRunnerService().runOnce("worker")).resolves.toBe(false);
    expect(mocks.runBook).not.toHaveBeenCalled();
  });
  it("passes an aborted signal to a handler when its running lease is cancelled", async () => {
    mocks.claim.mockResolvedValue(job); mocks.heartbeat.mockResolvedValue(false); mocks.fail.mockResolvedValue(true);
    await new JobRunnerService().runOnce("worker");
    expect(mocks.runBook).not.toHaveBeenCalled();
    expect(mocks.fail).toHaveBeenCalledWith("job-1", "worker", 3, "TRANSIENT", 1_000);
  });
  it("passes the configured attempt limit to terminal failure handling", async () => {
    mocks.claim.mockResolvedValue({ ...job, attemptCount: 3 }); mocks.heartbeat.mockResolvedValue(true); mocks.runBook.mockRejectedValueOnce(new Error("network timeout")); mocks.fail.mockResolvedValue(true);
    await new JobRunnerService().runOnce("worker");
    expect(mocks.fail).toHaveBeenCalledWith("job-1", "worker", 3, "TRANSIENT", 1_000);
  });
});
