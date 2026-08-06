import "server-only";

import { headers } from "next/headers";
import { getEnvironment } from "@/lib/config/env";

export interface RequestContext {
  clerkId: string;
  ipAddress: string;
  requestId: string;
}

export async function createRequestContext(clerkId: string, request?: Request): Promise<RequestContext> {
  const requestHeaders = request?.headers ?? (await headers());
  return {
    clerkId,
    ipAddress: getClientIp(requestHeaders),
    requestId: crypto.randomUUID(),
  };
}

function getClientIp(requestHeaders: Headers): string {
  if (getEnvironment().VERCEL !== "1") return "unknown";
  return requestHeaders.get("x-vercel-forwarded-for")?.trim() || "unknown";
}
