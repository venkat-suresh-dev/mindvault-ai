import { auth } from "@clerk/nextjs/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { BOOK_UPLOAD_LIMITS, BOOK_SUPPORTED_MIME_TYPES } from "@/features/books/constants/book-upload";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const body = await request.json() as HandleUploadBody;
  const json = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (pathname) => {
      if (!pathname.startsWith(`books/${userId}-`)) throw new Error("Invalid upload path.");
      return { allowedContentTypes: [...BOOK_SUPPORTED_MIME_TYPES.pdf], maximumSizeInBytes: BOOK_UPLOAD_LIMITS.pdfBytes, addRandomSuffix: true, tokenPayload: userId };
    },
    onUploadCompleted: async () => undefined,
  });
  return Response.json(json);
}
