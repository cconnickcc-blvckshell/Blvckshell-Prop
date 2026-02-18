"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPayoutBatch } from "@/server/actions/payout-actions";

export default function CreatePayoutBatchForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const defaultEnd = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const result = await createPayoutBatch({ periodStart, periodEnd });
    setIsPending(false);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Failed to create batch");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4 rounded-lg border bg-gray-50 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Period start</label>
        <input
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Period end</label>
        <input
          type="date"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create batch from approved jobs"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
