"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createDraftInvoice } from "@/server/actions/invoice-actions";

export default function NewInvoiceForm({
  clients,
  className = "",
}: {
  clients: { id: string; name: string }[];
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const clientId = formData.get("clientId") as string;
    const periodStart = formData.get("periodStart") as string;
    const periodEnd = formData.get("periodEnd") as string;
    if (!clientId || !periodStart || !periodEnd) {
      setError("Select client and period");
      setPending(false);
      return;
    }
    const result = await createDraftInvoice(
      clientId,
      new Date(periodStart),
      new Date(periodEnd)
    );
    setPending(false);
    if (result.success && result.invoiceId) {
      router.push(`/admin/invoices/${result.invoiceId}`);
      return;
    }
    setError(result.error ?? "Failed to create invoice");
  }

  return (
    <form onSubmit={handleSubmit} className={`rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 ${className}`}>
      {error && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-zinc-300">
            Client
          </label>
          <select
            id="clientId"
            name="clientId"
            required
            className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="periodStart" className="block text-sm font-medium text-zinc-300">
              Period start
            </label>
            <input
              id="periodStart"
              name="periodStart"
              type="date"
              required
              defaultValue={firstDay.toISOString().slice(0, 10)}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label htmlFor="periodEnd" className="block text-sm font-medium text-zinc-300">
              Period end
            </label>
            <input
              id="periodEnd"
              name="periodEnd"
              type="date"
              required
              defaultValue={lastDay.toISOString().slice(0, 10)}
              className="mt-1 block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>
      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create draft"}
        </button>
        <a
          href="/admin/invoices"
          className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
