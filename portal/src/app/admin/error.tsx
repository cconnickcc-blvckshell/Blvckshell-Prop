"use client";

import { useEffect } from "react";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({
      level: "ERROR",
      timestamp: new Date().toISOString(),
      where: "error-boundary:admin",
      message: error.message,
      digest: error.digest,
    }));
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="max-w-md space-y-4 text-center">
        <div className="text-4xl">⚠</div>
        <h1 className="text-xl font-bold text-white">Something went wrong</h1>
        <p className="text-sm text-zinc-400">
          {error.message === "Unauthorized"
            ? "Your session may have expired. Please sign in again."
            : "We hit an unexpected error. Our team has been notified."}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Try again
          </button>
          <a
            href="/login"
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Sign in
          </a>
        </div>
        {error.digest && (
          <p className="text-xs text-zinc-600">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
