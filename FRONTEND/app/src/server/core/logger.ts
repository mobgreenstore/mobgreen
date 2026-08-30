type LogLevel = "info" | "warn" | "error";
type Metadata = Record<string, unknown>;

const sensitiveKey =
  /password|secret|token|authorization|cookie|database.?url|connection.?string/i;

function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      ...(process.env.NODE_ENV !== "production" && value.stack
        ? { stack: value.stack }
        : {}),
    };
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, seen));
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      sensitiveKey.test(key) ? "[REDACTED]" : redact(item, seen),
    ]),
  );
}

function write(level: LogLevel, message: string, metadata: Metadata = {}) {
  const redactedMetadata = redact(metadata);
  const safeMetadata =
    redactedMetadata &&
    typeof redactedMetadata === "object" &&
    !Array.isArray(redactedMetadata)
      ? redactedMetadata
      : {};
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...safeMetadata,
  });

  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}

export const logger = {
  info: (message: string, metadata?: Metadata) =>
    write("info", message, metadata),
  warn: (message: string, metadata?: Metadata) =>
    write("warn", message, metadata),
  error: (message: string, metadata?: Metadata) =>
    write("error", message, metadata),
};
