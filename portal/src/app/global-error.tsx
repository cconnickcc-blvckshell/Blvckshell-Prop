"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md space-y-4 text-center">
            <div className="text-4xl">💥</div>
            <h1 className="text-xl font-bold">Critical Error</h1>
            <p className="text-sm text-zinc-400">
              Something went seriously wrong. Please refresh the page.
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Refresh
            </button>
            {error.digest && (
              <p className="text-xs text-zinc-600">Error ID: {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
