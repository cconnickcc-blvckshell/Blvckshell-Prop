"use client";

import { useState, useTransition } from "react";
import {
  previewBulkJobAction,
  executeBulkJobActionAction,
} from "@/server/actions/bulk-actions";
import type { BulkJobAction } from "@/server/bulk-actions/jobs";

type JobItem = { id: string; status: string };

export default function BulkJobActionsPanel({ jobs }: { jobs: JobItem[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<BulkJobAction>("approve");
  const [sharedReason, setSharedReason] = useState("");
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

  const allowedForApproveReject = jobs.filter((j) => j.status === "COMPLETED_PENDING_APPROVAL");
  const allowedForCancel = jobs.filter((j) => j.status === "SCHEDULED");
  const candidateIds = action === "cancel" ? allowedForCancel.map((j) => j.id) : allowedForApproveReject.map((j) => j.id);

  const handlePreview = () => {
    const ids = Array.from(selectedIds).filter((id) => candidateIds.includes(id));
    if (ids.length === 0) {
      setPreview({ valid: [], invalid: [], summary: "Select at least one job" });
      return;
    }
    startTransition(async () => {
      const p = await previewBulkJobAction(ids, action, { sharedReason });
      setPreview(p);
      setResult(null);
    });
  };

  const handleExecute = () => {
    const ids = preview?.valid.map((v) => v.id) ?? [];
    if (ids.length === 0) return;
    startTransition(async () => {
      const r = await executeBulkJobActionAction(ids, action, { sharedReason });
      setResult(r);
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === candidateIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidateIds));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Bulk job actions</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Each action is audited per item. Preview first, then confirm.
      </p>

      <div className="mt-4 flex flex-wrap gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm text-zinc-300">Action:</span>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value as BulkJobAction);
              setPreview(null);
              setResult(null);
            }}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
          >
            <option value="approve">Approve (COMPLETED_PENDING_APPROVAL → APPROVED_PAYABLE)</option>
            <option value="reject">Reject (COMPLETED_PENDING_APPROVAL → SCHEDULED)</option>
            <option value="cancel">Cancel (SCHEDULED → CANCELLED)</option>
          </select>
        </label>
        {(action === "reject" || action === "cancel") && (
          <label className="flex flex-col gap-1">
            <span className="text-sm text-zinc-300">Reason (required)</span>
            <input
              type="text"
              value={sharedReason}
              onChange={(e) => setSharedReason(e.target.value)}
              placeholder="Shared reason for all"
              className="min-w-[200px] rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white"
            />
          </label>
        )}
      </div>

      <div className="mt-4">
        <p className="text-sm text-zinc-400">
          {action === "cancel"
            ? `Scheduled jobs: ${allowedForCancel.length}`
            : `Pending approval: ${allowedForApproveReject.length}`}
        </p>
        <div className="mt-2 max-h-40 overflow-y-auto rounded border border-zinc-800 bg-zinc-800/50 p-2">
          <button
            type="button"
            onClick={toggleAll}
            className="mb-2 text-xs font-medium text-zinc-400 hover:text-white"
          >
            {selectedIds.size === candidateIds.length ? "Deselect all" : "Select all"}
          </button>
          <ul className="space-y-1">
            {(action === "cancel" ? allowedForCancel : allowedForApproveReject).map((job) => (
              <li key={job.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(job.id)}
                  onChange={() => toggleOne(job.id)}
                  className="rounded border-zinc-600"
                />
                <span className="text-sm text-zinc-300">
                  {job.id.slice(-8)} — {job.status}
                </span>
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
            Confirm and run ({preview.valid.length} items — each will be audited)
          </button>
        )}
      </div>

      {preview && (
        <div className="mt-4 rounded border border-zinc-700 bg-zinc-800/50 p-4">
          <p className="text-sm font-medium text-zinc-300">{preview.summary}</p>
          {preview.valid.length > 0 && (
            <p className="mt-1 text-xs text-emerald-400">Valid: {preview.valid.length}</p>
          )}
          {preview.invalid.length > 0 && (
            <ul className="mt-2 text-xs text-red-300">
              {preview.invalid.map((i) => (
                <li key={i.id}>{i.id.slice(-8)}: {i.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {result && (
        <div className="mt-4 rounded border border-emerald-800 bg-emerald-900/20 p-4">
          <p className="text-sm font-medium text-white">Done. Bulk operation ID: {result.bulkOperationId}</p>
          <p className="mt-1 text-xs text-zinc-400">Succeeded: {result.succeeded.length}</p>
          {result.failed.length > 0 && (
            <ul className="mt-2 text-xs text-red-300">
              {result.failed.map((f) => (
                <li key={f.id}>{f.id}: {f.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
