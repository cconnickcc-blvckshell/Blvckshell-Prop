"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveQuoteAreaTasks,
  saveQuoteSectionOverrides,
  updateQuotePaymentTerms,
} from "@/server/actions/proposal-content-actions";
import type { ProposalEditorSection, ProposalTaskEditorGroup } from "@/server/documents/proposal-pdf";

type Terms = "NET_30" | "DUE_ON_COMPLETION";

export default function ProposalQuoteOptions({
  quoteId,
  terms,
  termsLabel,
  locked,
  sections,
  taskGroups,
}: {
  quoteId: string;
  terms: Terms;
  termsLabel: string;
  locked: boolean;
  sections: ProposalEditorSection[];
  taskGroups: ProposalTaskEditorGroup[];
}) {
  const router = useRouter();
  const [value, setValue] = useState<Terms>(terms);
  const [rows, setRows] = useState(sections.map((section) => ({ key: section.key, body: section.body })));
  const [tasks, setTasks] = useState(taskGroups);
  const [pending, setPending] = useState<"terms" | "sections" | "tasks" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function saveTerms() {
    setError(null);
    setMessage(null);
    setPending("terms");
    const result = await updateQuotePaymentTerms(quoteId, value);
    setPending(null);
    if (result.success) {
      setMessage("Payment terms saved.");
      router.refresh();
    } else {
      setError(result.error ?? "Could not update terms");
    }
  }

  async function saveTasks() {
    setError(null);
    setMessage(null);
    setPending("tasks");
    const result = await saveQuoteAreaTasks(
      quoteId,
      tasks.map((group) => ({ areaType: group.areaType, tasks: group.tasks }))
    );
    setPending(null);
    if (result.success) {
      setMessage("Quote tasks saved.");
      router.refresh();
    } else {
      setError(result.error ?? "Could not save tasks");
    }
  }

  async function saveSections() {
    setError(null);
    setMessage(null);
    setPending("sections");
    const result = await saveQuoteSectionOverrides(quoteId, rows);
    setPending(null);
    if (result.success) {
      setMessage("Quote section text saved.");
      router.refresh();
    } else {
      setError(result.error ?? "Could not save section text");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Payment terms</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Current: {termsLabel}. The proposal states these terms. Due dates are counted from the invoice date.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-sm text-zinc-300" htmlFor="quotePaymentTerms">
            Terms
          </label>
          <select
            id="quotePaymentTerms"
            value={value}
            disabled={locked}
            onChange={(event) => setValue(event.target.value as Terms)}
            className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            <option value="NET_30">Net 30</option>
            <option value="DUE_ON_COMPLETION">Due on completion</option>
          </select>
          {!locked && (
            <button
              type="button"
              onClick={saveTerms}
              disabled={pending !== null}
              className="rounded-lg border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              {pending === "terms" ? "Saving…" : "Save terms"}
            </button>
          )}
        </div>
      </div>

      <details className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <summary className="cursor-pointer text-lg font-semibold text-white">Section text for this quote</summary>
        <p className="mt-2 text-sm text-zinc-400">
          Starts from the shared proposal text. Clear a section back to that wording and save to drop the override.
        </p>
        <div className="mt-4 space-y-4">
          {sections.map((section, index) => (
            <div key={section.key}>
              <label className="block text-sm text-zinc-300" htmlFor={`override-${section.key}`}>
                {section.title}
              </label>
              <textarea
                id={`override-${section.key}`}
                value={rows[index]?.body ?? ""}
                rows={4}
                disabled={locked}
                onChange={(event) =>
                  setRows((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, body: event.target.value } : row
                    )
                  )
                }
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white disabled:opacity-50"
              />
            </div>
          ))}
          {!locked && (
            <button
              type="button"
              onClick={saveSections}
              disabled={pending !== null}
              className="rounded-lg border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
            >
              {pending === "sections" ? "Saving…" : "Save quote text"}
            </button>
          )}
        </div>
      </details>

      {tasks.length > 0 && (
        <details className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <summary className="cursor-pointer text-lg font-semibold text-white">Tasks for this quote</summary>
          <p className="mt-2 text-sm text-zinc-400">
            Starts from the default task list. Match that list and save to drop the override for an area.
          </p>
          <div className="mt-4 space-y-4">
            {tasks.map((group, groupIndex) => (
              <div key={group.areaType}>
                <h3 className="text-sm font-medium text-zinc-200">{group.label}</h3>
                <div className="mt-2 space-y-2">
                  {group.tasks.map((task, taskIndex) => (
                    <div key={`${group.areaType}-${taskIndex}`} className="grid gap-2 sm:grid-cols-[1fr_180px]">
                      <input
                        aria-label={`${group.label} task ${taskIndex + 1}`}
                        value={task.description}
                        disabled={locked}
                        onChange={(event) =>
                          setTasks((current) =>
                            current.map((item, index) =>
                              index === groupIndex
                                ? {
                                    ...item,
                                    tasks: item.tasks.map((row, rowIndex) =>
                                      rowIndex === taskIndex ? { ...row, description: event.target.value } : row
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white disabled:opacity-50"
                      />
                      <input
                        aria-label={`${group.label} frequency ${taskIndex + 1}`}
                        value={task.frequency}
                        disabled={locked}
                        onChange={(event) =>
                          setTasks((current) =>
                            current.map((item, index) =>
                              index === groupIndex
                                ? {
                                    ...item,
                                    tasks: item.tasks.map((row, rowIndex) =>
                                      rowIndex === taskIndex ? { ...row, frequency: event.target.value } : row
                                    ),
                                  }
                                : item
                            )
                          )
                        }
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white disabled:opacity-50"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {!locked && (
              <button
                type="button"
                onClick={saveTasks}
                disabled={pending !== null}
                className="rounded-lg border border-zinc-600 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 disabled:opacity-50"
              >
                {pending === "tasks" ? "Saving…" : "Save quote tasks"}
              </button>
            )}
          </div>
        </details>
      )}
      {message && <p className="text-sm text-emerald-300">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
