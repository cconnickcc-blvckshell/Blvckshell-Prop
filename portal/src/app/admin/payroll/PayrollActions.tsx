"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTimeEntry, approveTimeEntries, exportPayrollBatch } from "@/server/actions/timeentry-actions";

interface Employee {
  id: string;
  displayName: string;
  workers: { id: string; user: { name: string } }[];
}

export default function PayrollActions({
  employees,
}: {
  employees: Employee[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create time entry form state
  const [workerId, setWorkerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [regularHours, setRegularHours] = useState("8");
  const [regularMins, setRegularMins] = useState("0");
  const [otHours, setOtHours] = useState("0");
  const [otMins, setOtMins] = useState("0");
  const [rate, setRate] = useState("25.00");
  const [notes, setNotes] = useState("");

  const allWorkers = employees.flatMap((e) =>
    e.workers.map((w) => ({ ...w, accountName: e.displayName }))
  );

  function handleCreate() {
    setError(null);
    setSuccess(null);
    if (!workerId) {
      setError("Select a worker");
      return;
    }
    const regularMinutes = parseInt(regularHours) * 60 + parseInt(regularMins);
    const overtimeMinutes = parseInt(otHours) * 60 + parseInt(otMins);
    const rateCents = Math.round(parseFloat(rate) * 100);

    startTransition(async () => {
      const result = await createTimeEntry({
        workerId,
        date,
        regularMinutes,
        overtimeMinutes,
        rateCentsPerHour: rateCents,
        notes: notes || undefined,
      });
      if (result.success) {
        setSuccess("Time entry created");
        setShowCreateForm(false);
        router.refresh();
      } else {
        setError(result.error ?? "Failed");
      }
    });
  }

  function handleExport() {
    setError(null);
    setSuccess(null);
    const batchRef = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
    const today = new Date();
    const periodStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const periodEnd = today.toISOString();

    startTransition(async () => {
      const result = await exportPayrollBatch({
        periodStart,
        periodEnd,
        batchRef,
      });
      if (result.success) {
        setSuccess(`Exported ${result.entries?.length ?? 0} entries as ${result.batchRef}`);
        router.refresh();
      } else {
        setError(result.error ?? "Export failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          {showCreateForm ? "Cancel" : "New time entry"}
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={isPending}
          className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
        >
          {isPending ? "Exporting…" : "Export approved entries"}
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <h3 className="mb-4 text-lg font-semibold text-white">New time entry</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Worker</label>
              <select
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              >
                <option value="">Select worker…</option>
                {allWorkers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.user.name} ({w.accountName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Regular hours / minutes</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={regularHours}
                  onChange={(e) => setRegularHours(e.target.value)}
                  className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-white"
                  placeholder="hrs"
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={regularMins}
                  onChange={(e) => setRegularMins(e.target.value)}
                  className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-white"
                  placeholder="min"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Overtime hours / minutes</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={otHours}
                  onChange={(e) => setOtHours(e.target.value)}
                  className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-white"
                  placeholder="hrs"
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={otMins}
                  onChange={(e) => setOtMins(e.target.value)}
                  className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-sm text-white"
                  placeholder="min"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-400">Rate ($/hr)</label>
              <input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-zinc-400">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500"
                placeholder="e.g. deep clean, extra shift"
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPending ? "Creating…" : "Create entry"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
