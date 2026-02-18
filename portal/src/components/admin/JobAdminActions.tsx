"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveCompletion, rejectCompletion } from "@/server/actions/job-actions";
import { transitionJob } from "@/lib/state-machine";

interface JobAdminActionsProps {
  jobId: string;
  status: string;
  canApproveReject?: boolean;
  canCancel?: boolean;
}

export default function JobAdminActions({
  jobId,
  status,
  canApproveReject = false,
  canCancel = false,
}: JobAdminActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = () => {
    setError(null);
    startTransition(async () => {
      const result = await approveCompletion(jobId);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Failed to approve");
      }
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectCompletion(jobId, rejectReason.trim());
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error ?? "Failed to reject");
      }
    });
  };

  const handleCancel = () => {
    if (!confirm("Cancel this job? This action can be audited.")) return;
    setError(null);
    startTransition(async () => {
      // We need to call transitionJob from client - use a server action
      const res = await fetch(`/api/admin/jobs/${jobId}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        router.refresh();
      } else {
        setError(data.error ?? "Failed to cancel");
      }
    });
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
      <h2 className="mb-4 text-lg font-semibold text-white">Actions</h2>
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        {canApproveReject && (
          <>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isPending ? "Processing…" : "Approve"}
            </button>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input
                type="text"
                placeholder="Rejection reason (required for reject)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
              <button
                type="button"
                onClick={handleReject}
                disabled={isPending || !rejectReason.trim()}
                className="rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
              >
                Reject (resubmit allowed)
              </button>
            </div>
          </>
        )}

        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            Cancel Job
          </button>
        )}
      </div>
    </div>
  );
}
