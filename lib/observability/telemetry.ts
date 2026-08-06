import "server-only";

import { getEnvironment } from "@/lib/config/env";
import { log, safeErrorMetadata, sanitizeMetadata, type LogMetadata } from "@/lib/observability/logger";

export interface Telemetry {
  captureException(error: unknown, context?: LogMetadata): Promise<void>;
}

class SentryTelemetry implements Telemetry {
  public async captureException(error: unknown, context: LogMetadata = {}): Promise<void> {
    const environment = getEnvironment();
    if (!environment.SENTRY_DSN) return;

    try {
      const dsn = new URL(environment.SENTRY_DSN);
      const projectId = dsn.pathname.replace(/^\//, "");
      const publicKey = dsn.username;
      if (!projectId || !publicKey) return;
      const event = {
        event_id: crypto.randomUUID().replace(/-/g, ""),
        timestamp: new Date().toISOString(),
        platform: "node",
        environment: environment.SENTRY_ENVIRONMENT ?? environment.NODE_ENV,
        level: "error",
        exception: { values: [{ type: error instanceof Error ? error.name : "UnknownError" }] },
        tags: sanitizeMetadata(context),
      };
      const endpoint = `${dsn.protocol}//${dsn.host}/api/${projectId}/envelope/?sentry_version=7&sentry_key=${encodeURIComponent(publicKey)}`;
      const envelope = `${JSON.stringify({ dsn: environment.SENTRY_DSN, sent_at: event.timestamp })}\n${JSON.stringify({ type: "event" })}\n${JSON.stringify(event)}`;
      await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/x-sentry-envelope" }, body: envelope, keepalive: true });
    } catch (telemetryError) {
      log("warn", "telemetry.capture_failed", safeErrorMetadata(telemetryError));
    }
  }
}

const telemetry: Telemetry = new SentryTelemetry();

export async function captureException(error: unknown, context: LogMetadata = {}): Promise<void> {
  await telemetry.captureException(error, context);
}
