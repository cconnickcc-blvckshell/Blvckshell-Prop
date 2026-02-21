"use client";

import { useState, useTransition } from "react";
import {
  previewBulkResolveIncidents,
  executeBulkResolveIncidentsAction,
} from "@/server/actions/bulk-actions";

type IncidentItem = { id: string; resolvedAt: Date | null };

export default function BulkResolveIncidentsPanel({ incidents }: { incidents: IncidentItem[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [resolutionNotes, setResolutionNotes] = useState("");
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

  const unresolved = incidents.filter((i) => i.resolvedAt == null);

  const handlePreview = () => {
    const ids = Array.from(selectedIds).filter((id) => unresolved.some((i) => i.id === id));
    if (ids.length === 0) {
      setPreview({ valid: [], invalid: [], summary: "Select at least one unresolved incident" });
      return;
    }
    startTransition(async () => {
      const p = await previewBulkResolveIncidents(ids, resolutionNotes);
      setPreview(p);
      setResult(null);
    });
  };

  const handleExecute = () => {
    const ids = preview?.valid.map((v) => v.id) ?? [];
    if (ids.length === 0) return;
    startTransition(async () => {
      const r = await executeBulkResolveIncidentsAction(ids, resolutionNotes);
      setResult(r);
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === unresolved.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(unresolved.map((i) => i.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-lg font-semibold text-white">Bulk mark incidents resolved</h2>
      <p className="mt-1 text-sm text-zinc-400">Each update is audited per item.</p>

      <div className="mt-4">
        <label className="block text-sm text-zinc-300">Resolution notes (shared)</label>
        <textarea
          value={resolutionNotes}
          onChange={(e) => { setResolutionNotes(e.target.value); setPreview(null); setResult(null); }}
          placeholder="Notes applied to all selected"
          rows={2}
          className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
        />
      </div>

      <div className="mt-4">
        <p className="text-sm text-zinc-400">Unresolved: {unresolved.length}</p>
        <div className="mt-2 max-h-32 overflow-y-auto rounded border border-zinc-800 bg-zinc-800/50 p-2">
          <button type="button" onClick={toggleAll} className="mb-2 text-xs font-medium text-zinc-400 hover:text-white">
            {selectedIds.size === unresolved.length ? "Deselect all" : "Select all"}
          </button>
          <ul className="space-y-1">
            {unresolved.map((i) => (
              <li key={i.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selectedIds.has(i.id)} onChange={() => toggleOne(i.id)} className="rounded border-zinc-600" />
                <span className="text-sm text-zinc-300">{i.id.slice(-8)}</span>
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
            Confirm and mark resolved ({preview.valid.length} — audited per item)
          </button>
        )}
      </div>

      {preview && <div className="mt-4 rounded border border-zinc-700 bg-zinc-800/50 p-4"><p className="text-sm text-zinc-300">{preview.summary}</p></div>}
      {result && (
        <div className="mt-4 rounded border border-emerald-800 bg-emerald-900/20 p-4">
          <p className="text-sm font-medium text-white">Bulk operation ID: {result.bulkOperationId}</p>
          <p className="text-xs text-zinc-400">Resolved: {result.succeeded.length}</p>
          {result.failed.length > 0 && <p className="text-xs text-red-300">{result.failed[0]?.message}</p>}
        </div>
      )}
    </div>
  );
}
