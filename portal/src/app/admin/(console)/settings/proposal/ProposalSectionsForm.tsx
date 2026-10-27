"use client";

import { useState } from "react";
import { saveProposalSections, type ProposalSectionDraft } from "@/server/actions/proposal-content-actions";

export default function ProposalSectionsForm({ sections }: { sections: ProposalSectionDraft[] }) {
  const [rows, setRows] = useState(sections);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(index: number, patch: Partial<ProposalSectionDraft>) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  }

  async function handleSave() {
    setError(null);
    setMessage(null);
    setPending(true);
    const result = await saveProposalSections(rows);
    setPending(false);
    if (result.success) setMessage("Saved. New proposals use this text. A quote can still override a section.");
    else setError(result.error ?? "Could not save");
  }

  return (
    <div className="space-y-4">
      {rows.map((row, index) => (
        <fieldset key={row.key} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <legend className="px-1 text-sm font-medium text-zinc-300">{row.title}</legend>
          <label className="mt-3 block text-xs text-zinc-400" htmlFor={`title-${row.key}`}>
            Heading
          </label>
          <input
            id={`title-${row.key}`}
            value={row.title}
            onChange={(event) => update(index, { title: event.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
          <label className="mt-3 block text-xs text-zinc-400" htmlFor={`body-${row.key}`}>
            Section text
          </label>
          <textarea
            id={`body-${row.key}`}
            value={row.body}
            rows={5}
            onChange={(event) => update(index, { body: event.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save section text"}
        </button>
        {message && <p className="text-sm text-emerald-300">{message}</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
}
