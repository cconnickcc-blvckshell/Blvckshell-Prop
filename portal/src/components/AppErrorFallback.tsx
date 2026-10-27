"use client";

import { useEffect } from "react";

export default function AppErrorFallback({
  error,
  reset,
  where,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  where: string;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "ERROR",
        timestamp: new Date().toISOString(),
        where,
        message: error.message,
        digest: error.digest,
      }),
    );
  }, [error, where]);

  const sessionExpired =
    error.message === "Unauthorized" || error.digest === "UNAUTHORIZED";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md space-y-4 text-center">
        <div className="text-4xl">⚠</div>
        <h1 className="text-xl font-bold text-white">Something went wrong</h1>
        <p className="text-sm text-zinc-400">
          {sessionExpired
            ? "Your session may have expired. Sign in again to continue."
            : "We hit an unexpected error loading this page. Try again. If it continues, the error ID below is in the server logs."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Try again
          </button>
          {sessionExpired && (
            <a
              href="/login"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
            >
              Sign in
            </a>
          )}
        </div>
        {error.digest && (
          <p className="text-xs text-zinc-600">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
