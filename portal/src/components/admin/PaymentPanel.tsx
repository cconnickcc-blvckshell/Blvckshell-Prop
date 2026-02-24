"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordPayment, settlePayment } from "@/server/actions/payment-actions";
import { formatPaymentStatus, formatPaymentRail } from "@/lib/format";

interface PaymentRecord {
  id: string;
  provider: string;
  providerRef: string | null;
  amountCents: number;
  status: string;
  settledAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export default function PaymentPanel({
  invoiceId,
  invoiceStatus,
  totalCents,
  clientPaymentRail,
  payments,
}: {
  invoiceId: string;
  invoiceStatus: string;
  totalCents: number;
  clientPaymentRail: string;
  payments: PaymentRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState(clientPaymentRail);
  const [amount, setAmount] = useState((totalCents / 100).toFixed(2));
  const [providerRef, setProviderRef] = useState("");

  const settledTotal = payments
    .filter((p) => p.status === "SETTLED")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const pendingTotal = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const outstandingCents = totalCents - settledTotal;

  const statusBadge: Record<string, string> = {
    PENDING: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    SETTLED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    FAILED: "bg-red-500/20 text-red-300 border-red-500/40",
    REFUNDED: "bg-zinc-600/30 text-zinc-300 border-zinc-500/40",
  };

  function handleRecord() {
    setError(null);
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents <= 0) {
      setError("Enter a valid amount");
      return;
    }
    startTransition(async () => {
      const result = await recordPayment({
        invoiceId,
        provider: provider as "STRIPE" | "SPARC" | "EFT" | "CHEQUE",
        amountCents: cents,
        providerRef: providerRef || undefined,
      });
      if (result.success) {
        setShowForm(false);
        setProviderRef("");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to record payment");
      }
    });
  }

  function handleSettle(paymentId: string) {
    setError(null);
    startTransition(async () => {
      const result = await settlePayment(paymentId);
      if (result.success) router.refresh();
      else setError(result.error ?? "Failed to settle");
    });
  }

  if (invoiceStatus === "Draft") return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Payments</h2>
        {invoiceStatus !== "Paid" && (
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            {showForm ? "Cancel" : "Record payment"}
          </button>
        )}
      </div>

      {/* Outstanding summary */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-zinc-500">Total: </span>
          <span className="font-medium text-white">${(totalCents / 100).toFixed(2)}</span>
        </div>
        <div>
          <span className="text-zinc-500">Settled: </span>
          <span className="font-medium text-emerald-400">${(settledTotal / 100).toFixed(2)}</span>
        </div>
        {pendingTotal > 0 && (
          <div>
            <span className="text-zinc-500">Pending: </span>
            <span className="font-medium text-amber-300">${(pendingTotal / 100).toFixed(2)}</span>
          </div>
        )}
        {outstandingCents > 0 && (
          <div>
            <span className="text-zinc-500">Outstanding: </span>
            <span className="font-medium text-red-300">${(outstandingCents / 100).toFixed(2)}</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Record payment form */}
      {showForm && (
        <div className="mb-4 space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              >
                <option value="STRIPE">Stripe</option>
                <option value="SPARC">SparcPay</option>
                <option value="EFT">EFT</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Reference (optional)</label>
              <input
                type="text"
                value={providerRef}
                onChange={(e) => setProviderRef(e.target.value)}
                placeholder="e.g. ch_xxx or cheque #"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleRecord}
            disabled={isPending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {isPending ? "Recording…" : "Record payment"}
          </button>
        </div>
      )}

      {/* Payment history */}
      {payments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead>
              <tr>
                <th className="pb-2 text-left text-xs font-medium uppercase text-zinc-400">Provider</th>
                <th className="pb-2 text-left text-xs font-medium uppercase text-zinc-400">Reference</th>
                <th className="pb-2 text-right text-xs font-medium uppercase text-zinc-400">Amount</th>
                <th className="pb-2 text-left text-xs font-medium uppercase text-zinc-400">Status</th>
                <th className="pb-2 text-right text-xs font-medium uppercase text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2 text-sm text-zinc-300">{formatPaymentRail(p.provider)}</td>
                  <td className="py-2 text-sm text-zinc-400">{p.providerRef || "—"}</td>
                  <td className="py-2 text-right text-sm font-medium text-zinc-200">
                    ${(p.amountCents / 100).toFixed(2)}
                  </td>
                  <td className="py-2">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${statusBadge[p.status] ?? ""}`}>
                      {formatPaymentStatus(p.status)}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {p.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => handleSettle(p.id)}
                        disabled={isPending}
                        className="text-xs font-medium text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                      >
                        Settle
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">No payments recorded yet.</p>
      )}
    </div>
  );
}
