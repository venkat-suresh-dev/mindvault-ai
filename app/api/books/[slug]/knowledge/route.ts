import { getBookBySlugForUser } from "@/features/books/services/book.service";
import { BookNotFoundError } from "@/features/books/errors/book-errors";
import { GenerationOrchestratorService } from "@/features/knowledge";
import { knowledgeArtifactRequestSchema } from "@/features/knowledge/validation/knowledge.validation";
import { auth } from "@clerk/nextjs/server";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to view knowledge." }, { status: 401 });
  const { slug } = await params;
  let book: Awaited<ReturnType<typeof getBookBySlugForUser>>;
  try { book = await getBookBySlugForUser(slug, userId); }
  catch (error) {
    if (error instanceof BookNotFoundError) return Response.json({ message: "This book is unavailable." }, { status: 404 });
    console.error("Knowledge book lookup failed.", { slug, error });
    return Response.json({ message: "Unable to verify this book." }, { status: 500 });
  }
  try {
    const artifacts = await new GenerationOrchestratorService().list(book._id.toString(), userId);
    return Response.json({ artifacts }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Knowledge artifact listing failed.", { bookId: book._id.toString(), error });
    return Response.json({ message: "Unable to load learning materials. Please try again." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to generate knowledge." }, { status: 401 });
  const body = knowledgeArtifactRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ message: "Provide a valid artifact type." }, { status: 400 });
  try {
    const book = await getBookBySlugForUser((await params).slug, userId);
    const artifact = await new GenerationOrchestratorService().request(book._id.toString(), userId, body.data.type);
    return Response.json({ artifact }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ message: error instanceof Error ? error.message : "Unable to start generation." }, { status: 400 }); }
}
