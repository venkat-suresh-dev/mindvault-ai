import { z } from "zod";

export const conversationIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Provide a valid conversation ID.");
export const conversationTitleSchema = z.string().trim().min(1, "Enter a conversation name.").max(120, "Keep the name under 120 characters.");
export const conversationListQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(50).default(30) });
export const messagePageQuerySchema = z.object({
  beforeSequence: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});
