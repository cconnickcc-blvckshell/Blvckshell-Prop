"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addContractBaseToInvoice } from "@/server/actions/invoice-actions";

export default function AddContractBaseButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setPending(true);
    const result = await addContractBaseToInvoice(invoiceId);
    setPending(false);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "Failed");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add monthly base from contracts"}
      </button>
      {error && <span className="text-sm text-red-400">{error}</span>}
    </div>
  );
}
