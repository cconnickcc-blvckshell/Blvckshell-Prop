/**
 * Structured error logger — the "tattletale" system.
 * Every error gets context: where, who, what, when.
 * In production, these go to console (Vercel captures to logs).
 * Future: pipe to external service (Sentry, Axiom, etc.)
 */

export interface ErrorContext {
  where: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export function logError(error: unknown, context: ErrorContext): void {
  const timestamp = new Date().toISOString();
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const entry = {
    level: "ERROR",
    timestamp,
    message,
    ...context,
    ...(stack ? { stack: stack.split("\n").slice(0, 5).join("\n") } : {}),
  };

  console.error(JSON.stringify(entry));
}

export function logWarn(message: string, context: Omit<ErrorContext, "where"> & { where: string }): void {
  console.warn(JSON.stringify({
    level: "WARN",
    timestamp: new Date().toISOString(),
    message,
    ...context,
  }));
}

export function logInfo(message: string, context: Omit<ErrorContext, "where"> & { where: string }): void {
  console.info(JSON.stringify({
    level: "INFO",
    timestamp: new Date().toISOString(),
    message,
    ...context,
  }));
}
