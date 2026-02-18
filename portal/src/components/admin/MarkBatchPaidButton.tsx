"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markPayoutBatchPaid } from "@/server/actions/payout-actions";

export default function MarkBatchPaidButton({
  batchId,
  status,
}: {
  batchId: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canMarkPaid = status !== "PAID";

  async function handleClick() {
    if (!canMarkPaid) return;
    setError(null);
    setIsPending(true);
    const result = await markPayoutBatchPaid(batchId);
    setIsPending(false);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Failed to mark paid");
    }
  }

  return (
    <div>
      {canMarkPaid && (
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "Processing..." : "Mark paid"}
        </button>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
