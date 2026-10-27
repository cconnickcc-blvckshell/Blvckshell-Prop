"use client";

import { useState } from "react";
import { QUOTE_AREA_LABELS, QUOTE_AREA_TYPES } from "@/lib/pdf/proposal-tasks";
import { saveProposalAreaTasks, type ProposalTaskDraft } from "@/server/actions/proposal-content-actions";

export default function ProposalTasksForm({ tasks }: { tasks: ProposalTaskDraft[] }) {
  const [rows, setRows] = useState(tasks);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(index: number, patch: Partial<ProposalTaskDraft>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  async function handleSave() {
    setError(null);
    setMessage(null);
    setPending(true);
    const result = await saveProposalAreaTasks(rows);
    setPending(false);
    if (result.success) setMessage("Task lists saved.");
    else setError(result.error ?? "Could not save tasks");
  }

  return (
    <div className="space-y-4">
      {QUOTE_AREA_TYPES.map((areaType) => {
        const items = rows
          .map((row, index) => ({ row, index }))
          .filter((item) => item.row.areaType === areaType);
        return (
          <fieldset key={areaType} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <legend className="px-1 text-sm font-medium text-zinc-300">{QUOTE_AREA_LABELS[areaType]}</legend>
            <div className="mt-3 space-y-3">
              {items.map(({ row, index }) => (
                <div key={`${areaType}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
                  <div>
                    <label className="block text-xs text-zinc-400" htmlFor={`task-${index}`}>
                      Task
                    </label>
                    <input
                      id={`task-${index}`}
                      value={row.description}
                      onChange={(event) => update(index, { description: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400" htmlFor={`freq-${index}`}>
                      Frequency
                    </label>
                    <input
                      id={`freq-${index}`}
                      value={row.frequency}
                      onChange={(event) => update(index, { frequency: event.target.value })}
                      className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                    className="self-end rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setRows((current) => [...current, { areaType, description: "", frequency: "Each visit" }])
                }
                className="text-sm text-zinc-300 underline hover:text-white"
              >
                Add task
              </button>
            </div>
          </fieldset>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save task lists"}
        </button>
        {message && <p className="text-sm text-emerald-300">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
