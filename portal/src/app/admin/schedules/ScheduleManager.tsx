"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRecurringSchedule,
  updateRecurringSchedule,
  deleteRecurringSchedule,
  generateJobsFromSchedules,
} from "@/server/actions/schedule-actions";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type SiteOption = { id: string; name: string };
type WorkerOption = { id: string; userName: string; accountName: string };
type Schedule = {
  id: string;
  siteId: string;
  siteName: string;
  assignedWorkerId: string | null;
  workerName: string | null;
  dayOfWeek: number;
  startTime: string;
  estimatedDurationMinutes: number;
  payoutAmountCents: number;
  isActive: boolean;
  lastGeneratedDate: string | null;
};

export default function ScheduleManager({
  schedules,
  sites,
  workers,
}: {
  schedules: Schedule[];
  sites: SiteOption[];
  workers: WorkerOption[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("06:00");
  const [duration, setDuration] = useState(60);
  const [payoutDollars, setPayoutDollars] = useState("85.00");
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [genFrom, setGenFrom] = useState("");
  const [genTo, setGenTo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);

  async function handleCreate() {
    if (!siteId) return;
    setCreating(true);
    setMessage(null);
    try {
      const result = await createRecurringSchedule({
        siteId,
        assignedWorkerId: workerId || undefined,
        dayOfWeek,
        startTime,
        estimatedDurationMinutes: duration,
        payoutAmountCents: Math.round(parseFloat(payoutDollars) * 100),
      });
      if (result.ok) {
        setMessage({ type: "success", text: "Schedule created" });
        setShowCreate(false);
        setSiteId("");
        setWorkerId("");
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to create schedule" });
    }
    setCreating(false);
  }

  async function handleToggle(id: string, currentActive: boolean) {
    await updateRecurringSchedule(id, { isActive: !currentActive });
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this recurring schedule?")) return;
    await deleteRecurringSchedule(id);
    router.refresh();
  }

  async function handleGenerate(fromDate: string, toDate: string) {
    setGenerating(true);
    setGenResult(null);
    const result = await generateJobsFromSchedules({ fromDate, toDate });
    if (result.ok) {
      setGenResult(`Created ${result.created} job(s), skipped ${result.skipped} duplicate(s).`);
    } else {
      setGenResult(`Error: ${result.error}`);
    }
    setGenerating(false);
    router.refresh();
  }

  function nextWeekRange() {
    const now = new Date();
    const dayOffset = ((7 - now.getDay()) % 7) + 1;
    const from = new Date(now);
    from.setDate(now.getDate() + dayOffset);
    const to = new Date(from);
    to.setDate(from.getDate() + 6);
    return { from: fmt(from), to: fmt(to) };
  }

  function nextMonthRange() {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { from: fmt(from), to: fmt(to) };
  }

  function fmt(d: Date) {
    return d.toISOString().split("T")[0];
  }

  const grouped = DAY_NAMES.map((name, idx) => ({
    day: name,
    dayIdx: idx,
    items: schedules.filter((s) => s.dayOfWeek === idx),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <div className={`rounded-md px-3 py-2 text-sm ${message.type === "success" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
          {message.text}
        </div>
      )}

      {/* Generate jobs section */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Generate Jobs</h2>
        <div className="flex flex-wrap items-end gap-3">
          <button
            type="button"
            onClick={() => { const r = nextWeekRange(); handleGenerate(r.from, r.to); }}
            disabled={generating}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate next week"}
          </button>
          <button
            type="button"
            onClick={() => { const r = nextMonthRange(); handleGenerate(r.from, r.to); }}
            disabled={generating}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {generating ? "Generating…" : "Generate next month"}
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-zinc-400">From</label>
            <input type="date" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} className="mt-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400">To</label>
            <input type="date" value={genTo} onChange={(e) => setGenTo(e.target.value)} className="mt-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white" />
          </div>
          <button
            type="button"
            onClick={() => handleGenerate(genFrom, genTo)}
            disabled={generating || !genFrom || !genTo}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Generate custom range
          </button>
        </div>
        {genResult && (
          <p className="mt-3 text-sm text-emerald-300">{genResult}</p>
        )}
      </div>

      {/* Create schedule */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Create Schedule</h2>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            {showCreate ? "Cancel" : "+ New schedule"}
          </button>
        </div>
        {showCreate && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs text-zinc-400">Site *</label>
              <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                <option value="">Select site</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Worker</label>
              <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                <option value="">Unassigned</option>
                {workers.map((w) => <option key={w.id} value={w.id}>{w.userName} ({w.accountName})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Day of week *</label>
              <select value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))} className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white">
                {DAY_NAMES.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Start time *</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Duration (min) *</label>
              <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={15} step={15} className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400">Payout ($) *</label>
              <input type="number" value={payoutDollars} onChange={(e) => setPayoutDollars(e.target.value)} step="0.01" min="0" className="mt-1 block w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <button type="button" onClick={handleCreate} disabled={creating || !siteId} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50">
                {creating ? "Creating…" : "Create schedule"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing schedules grouped by day */}
      {grouped.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-zinc-500">
          No recurring schedules yet. Create one above.
        </div>
      ) : (
        grouped.map((group) => (
          <div key={group.dayIdx} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="mb-3 text-base font-semibold text-white">{group.day}</h3>
            <div className="space-y-3">
              {group.items.map((s) => (
                <div key={s.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${s.isActive ? "border-zinc-700 bg-zinc-800/50" : "border-zinc-800 bg-zinc-900/30 opacity-60"}`}>
                  <div className="min-w-0">
                    <p className="font-medium text-white">{s.siteName}</p>
                    <p className="text-sm text-zinc-400">
                      {s.startTime} • {s.estimatedDurationMinutes} min • ${(s.payoutAmountCents / 100).toFixed(2)}
                    </p>
                    {s.workerName && <p className="text-xs text-zinc-500">Worker: {s.workerName}</p>}
                    {s.lastGeneratedDate && (
                      <p className="text-xs text-zinc-600">Last generated: {new Date(s.lastGeneratedDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(s.id, s.isActive)}
                      className={`rounded-md px-3 py-1 text-xs font-medium ${s.isActive ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30" : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"}`}
                    >
                      {s.isActive ? "Pause" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.id)}
                      className="rounded-md px-3 py-1 text-xs font-medium bg-red-500/20 text-red-300 hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
