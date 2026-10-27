"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateInvoicePaymentTerms } from "@/server/actions/invoice-actions";

type Terms = "NET_30" | "DUE_ON_COMPLETION";

export default function InvoiceTermsForm({
  invoiceId,
  terms,
  label,
}: {
  invoiceId: string;
  terms: Terms;
  label: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState<Terms>(terms);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setPending(true);
    const result = await updateInvoicePaymentTerms(invoiceId, value);
    setPending(false);
    if (result.success) router.refresh();
    else setError(result.error ?? "Could not update terms");
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
      <h2 className="text-lg font-semibold text-white">Payment terms</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Current: {label}. The due date is counted from the date the invoice is sent.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-zinc-300" htmlFor="paymentTerms">
          Terms
        </label>
        <select
          id="paymentTerms"
          value={value}
          onChange={(event) => setValue(event.target.value as Terms)}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
        >
          <option value="NET_30">Net 30</option>
          <option value="DUE_ON_COMPLETION">Due on completion</option>
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="rounded-lg border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save terms"}
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
