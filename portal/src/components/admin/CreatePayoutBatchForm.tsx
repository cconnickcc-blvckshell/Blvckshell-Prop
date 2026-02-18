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
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xl sm:gap-6 sm:p-6"
    >
      <div className="min-w-0 flex-1 sm:min-w-[140px]">
        <label className="block text-sm font-medium text-zinc-300">Period start</label>
        <input
          type="date"
          value={periodStart}
          onChange={(e) => setPeriodStart(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          required
        />
      </div>
      <div className="min-w-0 flex-1 sm:min-w-[140px]">
        <label className="block text-sm font-medium text-zinc-300">Period end</label>
        <input
          type="date"
          value={periodEnd}
          onChange={(e) => setPeriodEnd(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full shrink-0 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50 sm:w-auto"
      >
        {isPending ? "Creating…" : "Create batch from approved jobs"}
      </button>
      {error && <p className="w-full text-sm text-red-400 sm:order-last">{error}</p>}
    </form>
  );
}
