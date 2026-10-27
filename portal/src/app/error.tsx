"use client";

import AppErrorFallback from "@/components/AppErrorFallback";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppErrorFallback error={error} reset={reset} where="error-boundary:root" />;
}
