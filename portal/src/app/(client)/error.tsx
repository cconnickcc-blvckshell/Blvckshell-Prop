"use client";

import AppErrorFallback from "@/components/AppErrorFallback";

export default function ClientErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AppErrorFallback error={error} reset={reset} where="error-boundary:client" />;
}
