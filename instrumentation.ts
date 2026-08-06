import { validateEnvironment } from "@/lib/config/env";
import { captureException } from "@/lib/observability/telemetry";
import type { Instrumentation } from "next";

export async function register(): Promise<void> {
  validateEnvironment();
}

export const onRequestError: Instrumentation.onRequestError = async (error, _request, context) => {
  await captureException(error, {
    operation: "next-request-error",
    routePath: context.routePath,
    method: _request.method,
    routeType: context.routeType,
    routerKind: context.routerKind,
    errorClassification: error instanceof Error ? error.name : "UnknownError",
  });
};
