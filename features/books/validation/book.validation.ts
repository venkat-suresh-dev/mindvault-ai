import { BOOK_UPLOAD_LIMITS } from "@/features/books/constants/book-upload";
import { VOICE_PERSONA_IDS } from "@/features/books/constants/voice-personas";
import { z } from "zod";

export const createBookMetadataSchema = z.object({
  title: z.string().trim().min(BOOK_UPLOAD_LIMITS.title.min).max(BOOK_UPLOAD_LIMITS.title.max),
  author: z.string().trim().min(BOOK_UPLOAD_LIMITS.author.min).max(BOOK_UPLOAD_LIMITS.author.max),
  persona: z.enum(VOICE_PERSONA_IDS).optional(),
  fileUrl: z.string().url(),
  fileBlobKey: z.string().trim().min(1).max(512),
  coverUrl: z.string().url().optional(),
  coverBlobKey: z.string().trim().min(1).max(512).optional(),
  fileSize: z.number().int().positive().max(BOOK_UPLOAD_LIMITS.pdfBytes),
});

export const saveBookSegmentsSchema = z.object({
  bookId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid book ID."),
  segments: z
    .array(
      z.object({
        segmentIndex: z.number().int().nonnegative(),
        pageNumber: z.number().int().positive(),
        text: z.string().trim().min(1),
        tokenCount: z.number().int().nonnegative(),
      }),
    )
    .min(1)
    .max(5_000),
});

export const bookIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid book ID.");
export const bookSlugSchema = z.string().trim().min(1).max(220);
