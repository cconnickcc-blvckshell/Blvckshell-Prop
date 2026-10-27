"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateInvoiceStatus } from "@/server/actions/invoice-actions";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Void";

export default function InvoiceStatusActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: InvoiceStatus;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMarkSent() {
    setError(null);
    setPending(true);
    const result = await updateInvoiceStatus(invoiceId, "Sent");
    setPending(false);
    if (result.success) router.refresh();
    else setError(result.error ?? "Failed");
  }

  async function handleMarkPaid() {
    setError(null);
    setPending(true);
    const result = await updateInvoiceStatus(invoiceId, "Paid");
    setPending(false);
    if (result.success) router.refresh();
    else setError(result.error ?? "Failed");
  }

  if (status === "Void" || status === "Paid") return null;

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-400">{error}</span>}
      {status === "Draft" && (
        <button
          type="button"
          onClick={handleMarkSent}
          disabled={pending}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {pending ? "Updating…" : "Mark as Sent"}
        </button>
      )}
      {status === "Sent" && (
        <button
          type="button"
          onClick={handleMarkPaid}
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Updating…" : "Mark as Paid"}
        </button>
      )}
    </div>
  );
}
