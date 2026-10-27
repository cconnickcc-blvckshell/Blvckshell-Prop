/**
 * Log the real server exception next to the digest Next shows in the browser.
 * Next 14.2 sets `error.digest` and then console.errors the Error (Node runtime).
 * The client only receives a redacted message plus that digest.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { logError } = await import("@/lib/logger");
  const original = console.error.bind(console);
  let logging = false;

  console.error = (...args: unknown[]) => {
    original(...args);
    if (logging) return;
    for (const arg of args) {
      if (!(arg instanceof Error)) continue;
      const digest = (arg as Error & { digest?: string }).digest;
      if (!digest) continue;
      logging = true;
      try {
        logError(arg, {
          where: "next-render",
          metadata: { digest },
        });
      } finally {
        logging = false;
      }
    }
  };
}
