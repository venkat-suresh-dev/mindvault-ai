import { BOOK_SUPPORTED_MIME_TYPES, BOOK_UPLOAD_LIMITS } from "@/features/books/constants/book-upload";
import { VOICE_PERSONA_IDS } from "@/features/books/constants/voice-personas";
import { z } from "zod";

const fileSchema = z.custom<File>(
  (value) => typeof File !== "undefined" && value instanceof File,
  {
  message: "Choose a file to continue.",
  },
);

export const bookFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(BOOK_UPLOAD_LIMITS.title.min, "Enter a title with at least 2 characters.")
    .max(BOOK_UPLOAD_LIMITS.title.max, "Keep the title under 160 characters."),
  author: z
    .string()
    .trim()
    .min(BOOK_UPLOAD_LIMITS.author.min, "Enter an author name with at least 2 characters.")
    .max(BOOK_UPLOAD_LIMITS.author.max, "Keep the author name under 120 characters."),
  pdfFile: fileSchema
    .refine((file) => BOOK_SUPPORTED_MIME_TYPES.pdf.includes(file.type as "application/pdf"), "Upload a PDF file.")
    .refine(
      (file) => file.size <= BOOK_UPLOAD_LIMITS.pdfBytes,
      "The PDF is larger than the 50 MB limit.",
    ),
  coverImage: fileSchema
    .refine(
      (file) => BOOK_SUPPORTED_MIME_TYPES.cover.includes(file.type as (typeof BOOK_SUPPORTED_MIME_TYPES.cover)[number]),
      "Upload a PNG, JPEG, or WEBP cover image.",
    )
    .refine(
      (file) => file.size <= BOOK_UPLOAD_LIMITS.coverBytes,
      "The cover image is larger than the 8 MB limit.",
    )
    .optional(),
  voicePersona: z.enum(VOICE_PERSONA_IDS),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;
