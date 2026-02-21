"use client";

import { useState, useTransition } from "react";
import {
  previewBulkWorkOrderTransition,
  executeBulkWorkOrderTransitionAction,
} from "@/server/actions/bulk-actions";
import type { WorkOrderStatus } from "@prisma/client";

const STATUS_OPTIONS: { value: WorkOrderStatus; label: string }[] = [
  { value: "APPROVED", label: "Approved" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "COMPLETED", label: "Completed" },
  { value: "INVOICED", label: "Invoiced" },
  { value: "PAID", label: "Paid" },
];

type WorkOrderItem = { id: string; status: string };

export default function BulkWorkOrderPanel({ workOrders }: { workOrders: WorkOrderItem[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toStatus, setToStatus] = useState<WorkOrderStatus>("COMPLETED");
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
    const ids = Array.from(selectedIds);
    if (ids.length === 0) {
      setPreview({ valid: [], invalid: [], summary: "Select at least one work order" });
      return;
    }
    startTransition(async () => {
      const p = await previewBulkWorkOrderTransition(ids, toStatus);
      setPreview(p);
      setResult(null);
    });
  };

  const handleExecute = () => {
    const ids = preview?.valid.map((v) => v.id) ?? [];
    if (ids.length === 0) return;
    startTransition(async () => {
      const r = await executeBulkWorkOrderTransitionAction(ids, toStatus);
      setResult(r);
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === workOrders.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(workOrders.map((w) => w.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Bulk work order transition</h2>
      <p className="mt-1 text-sm text-zinc-400">Each transition is audited per item.</p>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm text-zinc-300">Transition to:</span>
          <select
            value={toStatus}
            onChange={(e) => { setToStatus(e.target.value as WorkOrderStatus); setPreview(null); setResult(null); }}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <div className="mt-2 max-h-32 overflow-y-auto rounded border border-zinc-800 bg-zinc-800/50 p-2">
          <button type="button" onClick={toggleAll} className="mb-2 text-xs font-medium text-zinc-400 hover:text-white">
            {selectedIds.size === workOrders.length ? "Deselect all" : "Select all"}
          </button>
          <ul className="space-y-1">
            {workOrders.map((w) => (
              <li key={w.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedIds.has(w.id)} onChange={() => toggleOne(w.id)} className="rounded border-zinc-600" />
                <span className="text-sm text-zinc-300">{w.id.slice(-8)} — {w.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handlePreview}
          disabled={isPending || selectedIds.size === 0}
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
            Confirm and run ({preview.valid.length} — audited per item)
          </button>
        )}
      </div>

      {preview && <div className="mt-4 rounded border border-zinc-700 bg-zinc-800/50 p-4"><p className="text-sm text-zinc-300">{preview.summary}</p></div>}
      {result && (
        <div className="mt-4 rounded border border-emerald-800 bg-emerald-900/20 p-4">
          <p className="text-sm font-medium text-white">Bulk operation ID: {result.bulkOperationId}</p>
          <p className="text-xs text-zinc-400">Succeeded: {result.succeeded.length}</p>
          {result.failed.length > 0 && <p className="text-xs text-red-300">{result.failed[0]?.message}</p>}
        </div>
      )}
    </div>
  );
}
