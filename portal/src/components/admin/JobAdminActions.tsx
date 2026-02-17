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
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions</h2>
      {error && (
        <div className="mb-4 rounded bg-red-50 p-2 text-sm text-red-800">{error}</div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        {canApproveReject && (
          <>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isPending ? "Processing..." : "Approve"}
            </button>
            <div className="flex flex-1 flex-col gap-2">
              <input
                type="text"
                placeholder="Rejection reason (required for reject)"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleReject}
                disabled={isPending || !rejectReason.trim()}
                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
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
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Cancel Job
          </button>
        )}
      </div>
    </div>
  );
}
