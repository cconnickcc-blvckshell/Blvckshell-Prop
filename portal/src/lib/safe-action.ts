import { logError } from "./logger";

type ActionResult<T = unknown> = { success: true; data?: T } | { success: false; error: string };

/**
 * Wraps a server action function with standardized error handling + logging.
 * Every server action should use this to guarantee:
 * 1. Errors are caught (never crashes)
 * 2. Errors are logged with context (tattletale)
 * 3. User gets a friendly error message
 */
export function safeAction<TArgs extends unknown[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<ActionResult<TResult>>
): (...args: TArgs) => Promise<ActionResult<TResult>> {
  return async (...args: TArgs): Promise<ActionResult<TResult>> => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, { where: `action:${name}` });

      const message = error instanceof Error && error.message === "Unauthorized"
        ? "Please sign in to continue."
        : error instanceof Error && error.message.startsWith("Forbidden")
        ? "You don't have permission for this action."
        : "Something went wrong. Please try again.";

      return { success: false, error: message };
    }
  };
}
