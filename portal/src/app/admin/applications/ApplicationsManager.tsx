"use client";

import { useState, useTransition } from "react";
import {
  updateApplicationStatus,
  approveClientSignup,
  rejectClientSignup,
} from "@/server/actions/application-actions";

interface WorkerApplication {
  id: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  applicationType: string;
  companyName: string | null;
  hasVehicle: boolean;
  availableDays: string[];
  availableShift: string | null;
  experienceYears: number | null;
  experienceSummary: string | null;
  references: unknown;
  hasCOI: boolean;
  hasWSIB: boolean;
  hasDriversLicense: boolean;
  agreedToTerms: boolean;
  agreedToBackgroundCheck: boolean;
  adminNotes: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

interface ClientSignup {
  id: string;
  status: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  buildingCount: number | null;
  buildingType: string | null;
  city: string | null;
  message: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-400 border-red-500/20",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ApplicationsManager({
  workerApplications,
  clientSignups,
}: {
  workerApplications: WorkerApplication[];
  clientSignups: ClientSignup[];
}) {
  const [activeTab, setActiveTab] = useState<"workers" | "clients">("workers");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectModalType, setRejectModalType] = useState<"worker" | "client">("worker");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleWorkerAction(
    id: string,
    status: "UNDER_REVIEW" | "APPROVED" | "REJECTED",
    reason?: string
  ) {
    startTransition(async () => {
      await updateApplicationStatus(id, status, {
        rejectionReason: reason,
      });
      setRejectModalId(null);
      setRejectionReason("");
    });
  }

  function handleClientApprove(id: string) {
    startTransition(async () => {
      await approveClientSignup(id);
    });
  }

  function handleClientReject(id: string, reason?: string) {
    startTransition(async () => {
      await rejectClientSignup(id, reason);
      setRejectModalId(null);
      setRejectionReason("");
    });
  }

  function openRejectModal(id: string, type: "worker" | "client") {
    setRejectModalId(id);
    setRejectModalType(type);
    setRejectionReason("");
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        {(["workers", "clients"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab
                ? "border-b-2 border-emerald-500 text-white"
                : "text-zinc-400 hover:text-zinc-300"
            }`}
          >
            {tab === "workers"
              ? `Worker Applications (${workerApplications.length})`
              : `Client Signups (${clientSignups.length})`}
          </button>
        ))}
      </div>

      {/* Worker Applications Table */}
      {activeTab === "workers" && (
        <div className="mt-4">
          {workerApplications.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              No worker applications yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Applied</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {workerApplications.map((app) => (
                    <>
                      <tr
                        key={app.id}
                        className="cursor-pointer transition hover:bg-zinc-800/30"
                        onClick={() =>
                          setExpandedId(expandedId === app.id ? null : app.id)
                        }
                      >
                        <td className="px-4 py-3 text-white">
                          {app.firstName} {app.lastName}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {app.applicationType === "SUBCONTRACTOR"
                            ? "Subcontractor"
                            : "Individual"}
                        </td>
                        <td className="px-4 py-3 text-zinc-400">{app.city}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3 text-zinc-500">
                          {formatDate(app.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="flex gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {app.status === "SUBMITTED" && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  handleWorkerAction(app.id, "UNDER_REVIEW")
                                }
                                className="rounded-md bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition hover:bg-amber-500/20 disabled:opacity-50"
                              >
                                Review
                              </button>
                            )}
                            {(app.status === "SUBMITTED" ||
                              app.status === "UNDER_REVIEW") && (
                              <>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleWorkerAction(app.id, "APPROVED")
                                  }
                                  className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() =>
                                    openRejectModal(app.id, "worker")
                                  }
                                  className="rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedId === app.id && (
                        <tr key={`${app.id}-details`}>
                          <td colSpan={6} className="bg-zinc-900/50 px-4 py-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <div>
                                <p className="text-xs font-medium text-zinc-500">
                                  Contact
                                </p>
                                <p className="mt-1 text-sm text-zinc-300">
                                  {app.email}
                                </p>
                                <p className="text-sm text-zinc-300">
                                  {app.phone}
                                </p>
                              </div>
                              {app.companyName && (
                                <div>
                                  <p className="text-xs font-medium text-zinc-500">
                                    Company
                                  </p>
                                  <p className="mt-1 text-sm text-zinc-300">
                                    {app.companyName}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-medium text-zinc-500">
                                  Experience
                                </p>
                                <p className="mt-1 text-sm text-zinc-300">
                                  {app.experienceYears != null
                                    ? `${app.experienceYears} years`
                                    : "Not specified"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-zinc-500">
                                  Availability
                                </p>
                                <p className="mt-1 text-sm text-zinc-300">
                                  {app.availableDays.join(", ") || "Not specified"}
                                </p>
                                <p className="text-sm text-zinc-400">
                                  Shift: {app.availableShift ?? "flexible"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-zinc-500">
                                  Credentials
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {app.hasVehicle && (
                                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                                      Vehicle
                                    </span>
                                  )}
                                  {app.hasDriversLicense && (
                                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                                      License
                                    </span>
                                  )}
                                  {app.hasCOI && (
                                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                                      COI
                                    </span>
                                  )}
                                  {app.hasWSIB && (
                                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                                      WSIB
                                    </span>
                                  )}
                                </div>
                              </div>
                              {app.experienceSummary && (
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <p className="text-xs font-medium text-zinc-500">
                                    Experience Summary
                                  </p>
                                  <p className="mt-1 text-sm text-zinc-300">
                                    {app.experienceSummary}
                                  </p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Client Signups Table */}
      {activeTab === "clients" && (
        <div className="mt-4">
          {clientSignups.length === 0 ? (
            <p className="py-12 text-center text-sm text-zinc-500">
              No client signup requests yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-left text-xs uppercase tracking-wider text-zinc-500">
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Buildings</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {clientSignups.map((signup) => (
                    <tr key={signup.id} className="transition hover:bg-zinc-800/30">
                      <td className="px-4 py-3 text-white">
                        {signup.companyName}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-zinc-300">{signup.contactName}</p>
                        <p className="text-xs text-zinc-500">
                          {signup.contactEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {signup.buildingCount ?? "—"}{" "}
                        {signup.buildingType && (
                          <span className="text-zinc-500">
                            ({signup.buildingType})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={signup.status} />
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {formatDate(signup.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {(signup.status === "SUBMITTED" ||
                            signup.status === "UNDER_REVIEW") && (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  handleClientApprove(signup.id)
                                }
                                className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() =>
                                  openRejectModal(signup.id, "client")
                                }
                                className="rounded-md bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">
              Reject Application
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Provide a reason for the rejection (optional).
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
              placeholder="Reason for rejection..."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectModalId(null);
                  setRejectionReason("");
                }}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (rejectModalType === "worker") {
                    handleWorkerAction(
                      rejectModalId,
                      "REJECTED",
                      rejectionReason || undefined
                    );
                  } else {
                    handleClientReject(
                      rejectModalId,
                      rejectionReason || undefined
                    );
                  }
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {isPending ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
