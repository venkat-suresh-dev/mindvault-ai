import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  findOneAndUpdate: vi.fn(),
  updateOne: vi.fn(),
  updateMany: vi.fn(),
  find: vi.fn(),
  findOne: vi.fn(),
}));

vi.mock("@/lib/db/connection", () => ({ connectToDatabase: mocks.connect }));
vi.mock("@/features/jobs/models/durable-job.model", () => ({ DurableJobModel: mocks }));

import { cancelJob, claimDueJob, completeJob, enqueueJob, failOrRetryJob, heartbeatJob, recoverExpiredLeases } from "./durable-job.repository";

function lean<T>(value: T) { return { lean: vi.fn().mockResolvedValue(value) }; }

describe("durable job repository", () => {
  beforeEach(() => vi.clearAllMocks());

  it("enqueues once with an idempotency key", async () => {
    mocks.findOneAndUpdate.mockReturnValue(lean({ _id: "job-1", status: "QUEUED" }));
    await enqueueJob({ type: "BOOK_PROCESSING", bookId: "book-1", clerkId: "user-1", idempotencyKey: "book-processing:book-1", maxAttempts: 3 });
    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      { idempotencyKey: "book-processing:book-1" },
      expect.objectContaining({ $setOnInsert: expect.objectContaining({ status: "QUEUED" }) }),
      expect.objectContaining({ upsert: true }),
    );
  });

  it("claims only queued jobs atomically and persists the lease owner", async () => {
    mocks.findOneAndUpdate.mockReturnValue(lean({ _id: "job-1", status: "RUNNING", leaseOwner: "worker-a" }));
    await claimDueJob("worker-a", 60_000);
    expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "QUEUED", nextRunAt: expect.any(Object) }),
      expect.objectContaining({ $set: expect.objectContaining({ status: "RUNNING", leaseOwner: "worker-a" }), $inc: { attemptCount: 1 } }),
      expect.objectContaining({ sort: { nextRunAt: 1, createdAt: 1 } }),
    );
  });

  it("heartbeats only a valid owned lease", async () => {
    mocks.updateOne.mockResolvedValueOnce({ modifiedCount: 1 }).mockResolvedValueOnce({ modifiedCount: 0 });
    await expect(heartbeatJob("job-1", "worker-a", 60_000)).resolves.toBe(true);
    await expect(heartbeatJob("job-1", "worker-b", 60_000)).resolves.toBe(false);
    expect(mocks.updateOne).toHaveBeenCalledWith(expect.objectContaining({ leaseOwner: "worker-a", leaseExpiresAt: expect.any(Object) }), expect.any(Object));
  });

  it("requeues retryable failures and terminally fails exhausted attempts", async () => {
    mocks.findOne.mockReturnValueOnce(lean({ attemptCount: 1 })).mockReturnValueOnce(lean({ attemptCount: 3 }));
    mocks.updateOne.mockResolvedValue({ modifiedCount: 1 });
    await failOrRetryJob("job-1", "worker-a", 3, "TRANSIENT", 1_000);
    await failOrRetryJob("job-2", "worker-a", 3, "PROVIDER", 1_000);
    expect(mocks.updateOne.mock.calls[0][1].$set.status).toBe("QUEUED");
    expect(mocks.updateOne.mock.calls[1][1].$set.status).toBe("FAILED");
  });

  it("cancels queued or running jobs and prevents later completion writes", async () => {
    mocks.updateOne.mockResolvedValueOnce({ modifiedCount: 1 }).mockResolvedValueOnce({ modifiedCount: 0 });
    await expect(cancelJob("job-1", "user-1")).resolves.toBe(true);
    await expect(completeJob("job-1", "worker-a")).resolves.toBe(false);
    expect(mocks.updateOne.mock.calls[0][0]).toMatchObject({ status: { $in: ["QUEUED", "RUNNING"] } });
    expect(mocks.updateOne.mock.calls[1][0]).toMatchObject({ status: "RUNNING", leaseOwner: "worker-a" });
  });

  it("recovers stale leases into queued work or terminal failure", async () => {
    const selected = { limit: vi.fn().mockReturnValue(lean([{ _id: "job-1", attemptCount: 1 }, { _id: "job-2", attemptCount: 3 }])) };
    mocks.find.mockReturnValue({ select: vi.fn().mockReturnValue(selected) });
    mocks.updateOne.mockResolvedValue({ modifiedCount: 1 });
    await expect(recoverExpiredLeases(3)).resolves.toBe(2);
    expect(mocks.updateOne.mock.calls[0][1].$set.status).toBe("QUEUED");
    expect(mocks.updateOne.mock.calls[1][1].$set.status).toBe("FAILED");
  });
});
