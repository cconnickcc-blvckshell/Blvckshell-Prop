"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { finalizeQuoteToContract } from "@/server/actions/quote-actions";

export default function QuoteProposalClient({
  quoteId,
  status,
  hasSnapshot,
}: {
  quoteId: string;
  status: string;
  hasSnapshot: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canFinalize = hasSnapshot && status === "SENT";

  function handlePrint() {
    window.print();
  }

  async function handleFinalize() {
    setError(null);
    setPending(true);
    const result = await finalizeQuoteToContract(quoteId);
    setPending(false);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error ?? "Failed to finalize quote");
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
      <button
        type="button"
        onClick={handlePrint}
        className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600"
      >
        Print / Save as PDF
      </button>
      {canFinalize && (
        <button
          type="button"
          onClick={handleFinalize}
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Finalizing…" : "Finalize & create contract"}
        </button>
      )}
      {!canFinalize && status !== "WON" && (
        <p className="text-xs text-zinc-400">
          Finalize is available after the quote is marked SENT with a passing snapshot.
        </p>
      )}
      {status === "WON" && (
        <p className="text-xs text-emerald-300">
          Quote finalized to contract. Base price is now set on the client&apos;s account.
        </p>
      )}
    </div>
  );
}

