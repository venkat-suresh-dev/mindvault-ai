import { describe, expect, it } from "vitest";
import { classifyJobError } from "./job-error-classifier";

describe("classifyJobError", () => {
  it.each([
    [new Error("job lease was lost"), "CANCELLED"],
    [new Error("provider request timed out"), "TIMEOUT"],
    [new Error("payload validation failed"), "VALIDATION"],
    [new Error("Gemini provider unavailable"), "PROVIDER"],
    [new Error("temporary database failure"), "TRANSIENT"],
  ] as const)("classifies %s", (error, expected) => {
    expect(classifyJobError(error)).toBe(expected);
  });
});
