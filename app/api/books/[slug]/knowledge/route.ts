import { getBookBySlugForUser } from "@/features/books/services/book.service";
import { BookNotFoundError } from "@/features/books/errors/book-errors";
import { GenerationOrchestratorService } from "@/features/knowledge";
import { knowledgeArtifactRequestSchema } from "@/features/knowledge/validation/knowledge.validation";
import { KNOWLEDGE_ARTIFACT_TYPES } from "@/features/knowledge/types/knowledge";
import { auth } from "@clerk/nextjs/server";
import { log, safeErrorMetadata } from "@/lib/observability/logger";
import { captureException } from "@/lib/observability/telemetry";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createRequestContext } from "@/lib/security/request-context";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to view knowledge." }, { status: 401 });
  const { slug } = await params;
  const type = new URL(request.url).searchParams.get("type");
  if (!type || !KNOWLEDGE_ARTIFACT_TYPES.includes(type as (typeof KNOWLEDGE_ARTIFACT_TYPES)[number])) return Response.json({ message: "Provide a valid artifact type." }, { status: 400 });
  let book: Awaited<ReturnType<typeof getBookBySlugForUser>>;
  try { book = await getBookBySlugForUser(slug, userId); }
  catch (error) {
    if (error instanceof BookNotFoundError) return Response.json({ message: "This book is unavailable." }, { status: 404 });
    log("error", "knowledge.book_lookup.failed", { ...safeErrorMetadata(error) });
    await captureException(error, { operation: "knowledge-book-lookup" });
    return Response.json({ message: "Unable to verify this book." }, { status: 500 });
  }
  try {
    const lifecycle = await new GenerationOrchestratorService().getLifecycle(book._id.toString(), userId, type as (typeof KNOWLEDGE_ARTIFACT_TYPES)[number]);
    return Response.json(lifecycle, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    log("error", "knowledge.list.failed", safeErrorMetadata(error));
    await captureException(error, { operation: "knowledge-list" });
    return Response.json({ message: "Unable to load learning materials. Please try again." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  if (!userId) return Response.json({ message: "Sign in to generate knowledge." }, { status: 401 });
  const requestContext = await createRequestContext(userId, request);
  const rateLimit = await enforceRateLimit("knowledge", requestContext);
  if (!rateLimit.allowed) {
    return Response.json(
      { message: "Too many generation requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }
  const body = knowledgeArtifactRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return Response.json({ message: "Provide a valid artifact type." }, { status: 400 });
  try {
    const book = await getBookBySlugForUser((await params).slug, userId);
    await new GenerationOrchestratorService().request(book._id.toString(), userId, body.data.type);
    const lifecycle = await new GenerationOrchestratorService().getLifecycle(book._id.toString(), userId, body.data.type);
    return Response.json(lifecycle, { status: 202, headers: { "Cache-Control": "no-store", "X-Request-Id": requestContext.requestId } });
  } catch (error) {
    log("error", "knowledge.request.failed", { requestId: requestContext.requestId, ...safeErrorMetadata(error) });
    await captureException(error, { requestId: requestContext.requestId, operation: "knowledge-request" });
    return Response.json({ message: "Unable to start generation." }, { status: 400 });
  }
}
