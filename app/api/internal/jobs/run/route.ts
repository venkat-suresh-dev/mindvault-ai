import { JobRunnerService } from "@/features/jobs/services/job-runner.service";
import { getEnvironment } from "@/lib/config/env";
import { log } from "@/lib/observability/logger";
import { timingSafeEqual } from "crypto";

export async function GET(request: Request) {
  if (!hasValidWorkerSecret(request)) return new Response("Not found.", { status: 404 });
  const workerId = crypto.randomUUID();
  const ran = await new JobRunnerService().runOnce(workerId);
  log("info", "job.worker.invocation.completed", { ran });
  return Response.json({ ran });
}

function hasValidWorkerSecret(request: Request): boolean {
  const environment = getEnvironment();
  const received = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!received) return false;
  const receivedBuffer = Buffer.from(received);
  return [environment.JOB_RUNNER_SECRET, environment.CRON_SECRET].some((expected) => {
    if (!expected) return false;
    const expectedBuffer = Buffer.from(expected);
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
  });
}
