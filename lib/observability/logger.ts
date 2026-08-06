import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";
type SafeLogValue = boolean | number | string | null | SafeLogValue[] | { [key: string]: SafeLogValue };
export type LogMetadata = Record<string, SafeLogValue | undefined>;

const MAX_DEPTH = 5;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 40;
const MAX_STRING_LENGTH = 1_024;
const SENSITIVE_KEY_PATTERN = /authorization|token|secret|password|cookie|prompt|document|text|content|embedding|vector|blob|storage|(?:blob|storage|file|object).?key|request.?body|(?:^|[_-])body(?:[_-]|$)/i;

export function log(level: LogLevel, event: string, metadata: LogMetadata = {}): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...sanitizeMetadata(metadata),
  };
  console[level === "debug" ? "debug" : level](JSON.stringify(entry));
}

export function logOperation(
  level: LogLevel,
  event: string,
  startedAt: number,
  metadata: LogMetadata = {},
): void {
  log(level, event, { ...metadata, durationMs: Date.now() - startedAt });
}

export function safeErrorMetadata(error: unknown): LogMetadata {
  return { errorName: error instanceof Error ? error.name : "UnknownError" };
}

export function sanitizeMetadata(metadata: LogMetadata): LogMetadata {
  return sanitizeValue(metadata, 0, new WeakSet<object>()) as LogMetadata;
}

function sanitizeValue(value: unknown, depth: number, seen: WeakSet<object>): SafeLogValue {
  if (value === null) return null;
  if (typeof value === "string") return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…[TRUNCATED]` : value;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : "[NonFiniteNumber]";
  if (typeof value === "bigint") return "[BigInt]";
  if (typeof value === "symbol") return "[Symbol]";
  if (typeof value === "function") return "[Function]";
  if (depth >= MAX_DEPTH) return "[MaxDepth]";
  if (value instanceof Error) return summarizeError(value);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "[InvalidDate]" : value.toISOString();
  if (typeof value !== "object") return "[UnsupportedValue]";
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    const result = value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeValue(item, depth + 1, seen));
    if (value.length > MAX_ARRAY_ITEMS) result.push("[TruncatedArray]");
    return result;
  }

  if (!isPlainObject(value)) return `[UnsupportedObject:${objectName(value)}]`;
  const result: Record<string, SafeLogValue> = {};
  for (const [key, item] of Object.entries(value).slice(0, MAX_OBJECT_KEYS)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitizeValue(item, depth + 1, seen);
  }
  if (Object.keys(value).length > MAX_OBJECT_KEYS) result.truncated = "[TruncatedObject]";
  return result;
}

function summarizeError(error: Error): SafeLogValue {
  const code = Reflect.get(error, "code");
  return typeof code === "string" || typeof code === "number"
    ? { name: error.name, code: String(code) }
    : { name: error.name };
}

function isPlainObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function objectName(value: object): string {
  const constructor = Reflect.get(value, "constructor");
  return typeof constructor === "function" && typeof constructor.name === "string"
    ? constructor.name.slice(0, 80)
    : "Object";
}
