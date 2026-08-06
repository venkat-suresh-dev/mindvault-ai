import { LegacyReconciliationService } from "@/features/jobs/services/legacy-reconciliation.service";
import { getEnvironment } from "@/lib/config/env";
import { timingSafeEqual } from "crypto";

export async function POST(request: Request) {
  if (!hasValidWorkerSecret(request)) return new Response("Not found.", { status: 404 });
  return Response.json(await new LegacyReconciliationService().reconcile());
}

function hasValidWorkerSecret(request: Request): boolean {
  const expected = getEnvironment().JOB_RUNNER_SECRET;
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !received) return false;
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}
