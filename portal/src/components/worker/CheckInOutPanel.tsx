"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkIn, checkOut } from "@/server/actions/worker-actions";

export default function CheckInOutPanel({
  jobId,
  status,
  checkedInAt,
  checkedOutAt,
}: {
  jobId: string;
  status: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (status !== "SCHEDULED" && !checkedInAt) return null;
  if (checkedOutAt) {
    const duration = checkedInAt
      ? Math.round((new Date(checkedOutAt).getTime() - new Date(checkedInAt).getTime()) / 60000)
      : 0;
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="text-sm font-medium text-emerald-300">Checked out</span>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          {new Date(checkedInAt!).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })} — {new Date(checkedOutAt).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })} ({duration} min)
        </p>
      </div>
    );
  }

  function handleCheckIn() {
    setError(null);
    startTransition(async () => {
      const result = await checkIn(jobId);
      if (result.success) router.refresh();
      else setError(result.error ?? "Check-in failed");
    });
  }

  function handleCheckOut() {
    setError(null);
    startTransition(async () => {
      const result = await checkOut(jobId);
      if (result.success) router.refresh();
      else setError(result.error ?? "Check-out failed");
    });
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      {error && (
        <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">{error}</div>
      )}
      {!checkedInAt ? (
        <button
          type="button"
          onClick={handleCheckIn}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-base font-semibold text-white hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 transition-all min-h-[56px]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
          {isPending ? "Checking in..." : "Check In"}
        </button>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-emerald-300">Checked in at {new Date(checkedInAt).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckOut}
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 py-4 text-base font-semibold text-white hover:bg-zinc-700 active:scale-[0.98] disabled:opacity-50 transition-all min-h-[56px]"
          >
            {isPending ? "Checking out..." : "Check Out"}
          </button>
        </div>
      )}
    </div>
  );
}
