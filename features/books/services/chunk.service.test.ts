import { describe, expect, it } from "vitest";
import { vi } from "vitest";
vi.mock("@/features/books/constants/book-upload", () => ({ BOOK_PROCESSING_CONFIG: { chunkSizeWords: 500, chunkOverlapWords: 50 } }));
import { ChunkAccumulator } from "./chunk.service";

describe("ChunkAccumulator", () => {
  it("preserves overlap across page windows and resumes at the checkpoint segment index", () => {
    const accumulator = new ChunkAccumulator({ chunkSizeWords: 4, chunkOverlapWords: 1 }, 3);
    expect(accumulator.push([{ pageNumber: 1, text: "one two three" }])).toEqual([]);
    expect(accumulator.push([{ pageNumber: 2, text: "four five six" }]).map((segment) => segment.text)).toEqual(["one two three four"]);
    expect(accumulator.finish().map((segment) => ({ index: segment.segmentIndex, text: segment.text }))).toEqual([{ index: 4, text: "four five six" }]);
  });
});
