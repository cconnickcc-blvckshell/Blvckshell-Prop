"use client";

import AppErrorFallback from "@/components/AppErrorFallback";

export default function AdminErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppErrorFallback error={error} reset={reset} where="error-boundary:admin" />;
}
