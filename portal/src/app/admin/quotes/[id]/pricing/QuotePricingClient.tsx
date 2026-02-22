"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { computeAndPersistSnapshot, transitionQuoteToSent } from "@/server/actions/quote-actions";

export default function QuotePricingClient({
  quoteId,
  status,
  hasSnapshot,
  expired,
  hasScope,
  gatesPassed,
}: {
  quoteId: string;
  status: string;
  hasSnapshot: boolean;
  expired: boolean;
  hasScope: boolean;
  gatesPassed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComputeSnapshot() {
    setError(null);
    setPending(true);
    const result = await computeAndPersistSnapshot(quoteId);
    setPending(false);
    if (result.ok) router.refresh();
    else setError(result.error ?? "Failed");
  }

  async function handleSend() {
    setError(null);
    setPending(true);
    const result = await transitionQuoteToSent(quoteId);
    setPending(false);
    if (result.ok) router.refresh();
    else setError(result.error ?? "Failed");
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
      {!hasSnapshot && (
        <button
          type="button"
          onClick={handleComputeSnapshot}
          disabled={pending || !hasScope}
          className="rounded-lg bg-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-500 disabled:opacity-50"
        >
          {pending ? "Computing…" : "Compute snapshot"}
        </button>
      )}
      {!hasScope && !hasSnapshot && (
        <p className="text-sm text-amber-400">Add scope in walkthrough first.</p>
      )}
      {hasSnapshot && !expired && gatesPassed && (status === "DRAFT" || status === "READY_FOR_REVIEW") && (
        <button
          type="button"
          onClick={handleSend}
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Sending…" : "Mark as SENT"}
        </button>
      )}
      {hasSnapshot && expired && (
        <p className="text-amber-400 text-sm">Quote expired. Regenerate snapshot with current policy to send.</p>
      )}
    </div>
  );
}
