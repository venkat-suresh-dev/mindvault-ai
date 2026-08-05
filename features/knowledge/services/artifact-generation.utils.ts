import { z } from "zod";
import type { MindMapNode } from "@/features/knowledge/types/knowledge";

export function parseGeneratedJson<T>(value: string, schema: z.ZodType<T>): T {
  const json = value.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  return schema.parse(JSON.parse(json));
}

export const summarySchema = z.object({ executiveSummary: z.string(), overview: z.string(), mainThemes: z.array(z.string()), importantConcepts: z.array(z.string()), mainArguments: z.array(z.string()), conclusion: z.string() });
export const takeawaysSchema = z.object({ items: z.array(z.object({ text: z.string() })) });
export const flashcardsSchema = z.object({ items: z.array(z.object({ question: z.string(), answer: z.string(), difficulty: z.enum(["EASY", "MEDIUM", "HARD"]) })) });
export const quizSchema = z.object({ items: z.array(z.object({ type: z.enum(["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]), question: z.string(), options: z.array(z.string()), answer: z.string(), explanation: z.string() })) });
export const mindMapSchema: z.ZodType<MindMapNode> = z.object({ topic: z.string(), children: z.array(z.lazy(() => mindMapSchema)) });
