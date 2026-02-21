"use client";

import { useState, useTransition } from "react";
import {
  previewBulkGenerateDrafts,
  executeBulkGenerateDraftsAction,
} from "@/server/actions/bulk-actions";

export default function BulkGenerateDraftsPanel({
  clients,
}: {
  clients: { id: string; name: string }[];
}) {
  const [clientId, setClientId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [preview, setPreview] = useState<{
    valid: { id: string; currentState: string; intendedAction: string }[];
    invalid: { id: string; currentState: string; intendedAction: string; error?: string }[];
    summary: string;
  } | null>(null);
  const [result, setResult] = useState<{
    bulkOperationId: string;
    succeeded: string[];
    failed: { id: string; code: string; message: string }[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const handlePreview = () => {
    if (!clientId || !periodStart || !periodEnd) return;
    startTransition(async () => {
      const p = await previewBulkGenerateDrafts(
        clientId,
        new Date(periodStart),
        new Date(periodEnd)
      );
      setPreview(p);
      setResult(null);
    });
  };

  const handleExecute = () => {
    if (!clientId || !periodStart || !periodEnd || !preview?.valid.length) return;
    startTransition(async () => {
      const r = await executeBulkGenerateDraftsAction(
        clientId,
        new Date(periodStart),
        new Date(periodEnd)
      );
      setResult(r);
    });
  };

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Bulk generate draft invoices</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Create a draft for one client and period. Each creation is audited.
      </p>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-300">Client</span>
          <select
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setPreview(null); setResult(null); }}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white min-w-[200px]"
          >
            <option value="">Select client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-300">Period start</span>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => { setPeriodStart(e.target.value); setPreview(null); setResult(null); }}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-zinc-300">Period end</span>
          <input
            type="date"
            value={periodEnd}
            onChange={(e) => { setPeriodEnd(e.target.value); setPreview(null); setResult(null); }}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isPending || !clientId || !periodStart || !periodEnd}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          Preview
        </button>
        {preview && preview.valid.length > 0 && (
          <button
            type="button"
            onClick={handleExecute}
            disabled={isPending}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            Confirm and create draft (audited)
          </button>
        )}
      </div>

      {preview && (
        <div className="mt-4 rounded border border-zinc-700 bg-zinc-800/50 p-4">
          <p className="text-sm font-medium text-zinc-300">{preview.summary}</p>
          {preview.invalid.length > 0 && (
            <p className="mt-1 text-xs text-red-300">{preview.invalid[0]?.error}</p>
          )}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded border border-emerald-800 bg-emerald-900/20 p-4">
          <p className="text-sm font-medium text-white">Bulk operation ID: {result.bulkOperationId}</p>
          <p className="mt-1 text-xs text-zinc-400">Created: {result.succeeded.length}</p>
          {result.failed.length > 0 && (
            <p className="mt-1 text-xs text-red-300">{result.failed[0]?.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
