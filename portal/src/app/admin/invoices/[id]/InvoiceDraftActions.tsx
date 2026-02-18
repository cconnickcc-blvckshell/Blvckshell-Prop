"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  addJobToInvoice,
  removeJobFromInvoice,
  addBillingAdjustment,
} from "@/server/actions/invoice-actions";

type Action = "add" | "remove" | "adjustment";

export default function InvoiceDraftActions({
  invoiceId,
  jobId,
  action,
}: {
  invoiceId: string;
  jobId?: string;
  action: Action;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!jobId) return;
    setError(null);
    setPending(true);
    const result = await addJobToInvoice(invoiceId, jobId);
    setPending(false);
    if (result.success) router.refresh();
    else setError(result.error ?? "Failed");
  }

  async function handleRemove() {
    if (!jobId) return;
    setError(null);
    setPending(true);
    const result = await removeJobFromInvoice(invoiceId, jobId);
    setPending(false);
    if (result.success) router.refresh();
    else setError(result.error ?? "Failed");
  }

  async function handleAdjustmentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const type = formData.get("type") as "Charge" | "Discount" | "Credit";
    const amountStr = formData.get("amountCents") as string;
    const amountCents = Math.round(parseFloat(amountStr) * 100);
    const notes = (formData.get("notes") as string) || undefined;
    if (!type || isNaN(amountCents) || amountCents <= 0) {
      setError("Type and amount required");
      setPending(false);
      return;
    }
    const result = await addBillingAdjustment(invoiceId, type, amountCents, { notes });
    setPending(false);
    if (result.success) {
      form.reset();
      router.refresh();
    } else setError(result.error ?? "Failed");
  }

  if (action === "add") {
    return (
      <div>
        {error && <p className="mb-1 text-xs text-red-400">{error}</p>}
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
    );
  }

  if (action === "remove") {
    return (
      <div>
        {error && <p className="mb-1 text-xs text-red-400">{error}</p>}
        <button
          type="button"
          onClick={handleRemove}
          disabled={pending}
          className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
        >
          {pending ? "Removing…" : "Remove"}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleAdjustmentSubmit} className="flex flex-wrap items-end gap-3">
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
      <div>
        <label htmlFor="adj-type" className="block text-xs text-zinc-400">Type</label>
        <select
          id="adj-type"
          name="type"
          className="mt-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white"
        >
          <option value="Charge">Charge</option>
          <option value="Discount">Discount</option>
          <option value="Credit">Credit</option>
        </select>
      </div>
      <div>
        <label htmlFor="adj-amount" className="block text-xs text-zinc-400">Amount ($)</label>
        <input
          id="adj-amount"
          name="amountCents"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="0.00"
          className="mt-1 w-24 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white"
        />
      </div>
      <div className="flex-1 min-w-[160px]">
        <label htmlFor="adj-notes" className="block text-xs text-zinc-400">Notes</label>
        <input
          id="adj-notes"
          name="notes"
          type="text"
          placeholder="Optional"
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-sm text-white"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-500 disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add adjustment"}
      </button>
    </form>
  );
}
