import { BOOK_SUPPORTED_MIME_TYPES, BOOK_UPLOAD_LIMITS } from "@/features/books/constants/book-upload";
import { VOICE_PERSONA_IDS } from "@/features/books/constants/voice-personas";
import { z } from "zod";

export const createBookMetadataSchema = z.object({
  title: z.string().trim().min(BOOK_UPLOAD_LIMITS.title.min).max(BOOK_UPLOAD_LIMITS.title.max),
  author: z.string().trim().min(BOOK_UPLOAD_LIMITS.author.min).max(BOOK_UPLOAD_LIMITS.author.max),
  persona: z.enum(VOICE_PERSONA_IDS).optional(),
  fileUrl: z.string().url().optional(),
  fileBlobKey: z.string().trim().min(1).max(512),
  coverUrl: z.string().url().optional(),
  coverBlobKey: z.string().trim().min(1).max(512).optional(),
  fileSize: z.number().int().positive().max(BOOK_UPLOAD_LIMITS.pdfBytes),
});

const uploadedFileSchema = z.custom<File>((value) => typeof File !== "undefined" && value instanceof File);

export const processBookUploadSchema = z.object({
  title: z.string().trim().min(BOOK_UPLOAD_LIMITS.title.min).max(BOOK_UPLOAD_LIMITS.title.max),
  author: z.string().trim().min(BOOK_UPLOAD_LIMITS.author.min).max(BOOK_UPLOAD_LIMITS.author.max),
  persona: z.enum(VOICE_PERSONA_IDS),
  pdfFile: uploadedFileSchema
    .refine((file) => BOOK_SUPPORTED_MIME_TYPES.pdf.includes(file.type as "application/pdf"), "Upload a PDF file.")
    .refine(
      (file) => file.size > 0 && file.size <= BOOK_UPLOAD_LIMITS.pdfBytes,
      "The PDF is larger than the 50 MB limit.",
    ),
  coverImage: uploadedFileSchema
    .refine(
      (file) => BOOK_SUPPORTED_MIME_TYPES.cover.includes(file.type as (typeof BOOK_SUPPORTED_MIME_TYPES.cover)[number]),
      "Upload a PNG, JPEG, or WEBP cover image.",
    )
    .refine(
      (file) => file.size > 0 && file.size <= BOOK_UPLOAD_LIMITS.coverBytes,
      "The cover image is larger than the 8 MB limit.",
    )
    .optional(),
});

export const saveBookSegmentsSchema = z.object({
  bookId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid book ID."),
  segments: z
    .array(
      z.object({
        segmentIndex: z.number().int().nonnegative(),
        pageNumber: z.number().int().positive(),
        text: z.string().trim().min(1),
        wordCount: z.number().int().positive(),
        characterCount: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(5_000),
});

export const bookIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid book ID.");
export const bookSlugSchema = z.string().trim().min(1).max(220);
