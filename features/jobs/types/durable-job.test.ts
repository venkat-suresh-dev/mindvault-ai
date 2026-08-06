import { describe, expect, it } from "vitest";
import { DURABLE_JOB_STATUSES, DURABLE_JOB_TYPES } from "./durable-job";

describe("durable job contract", () => {
  it("declares every worker lifecycle state", () => {
    expect(DURABLE_JOB_STATUSES).toEqual(["QUEUED", "RUNNING", "COMPLETED", "FAILED", "CANCELLED"]);
  });

  it("supports the isolated book and knowledge workloads", () => {
    expect(DURABLE_JOB_TYPES).toEqual(["BOOK_PROCESSING", "KNOWLEDGE_GENERATION"]);
  });
});
