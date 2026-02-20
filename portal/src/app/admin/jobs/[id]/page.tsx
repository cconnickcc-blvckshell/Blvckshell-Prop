import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import JobAdminActions from "@/components/admin/JobAdminActions";

export default async function AdminJobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      site: {
        include: {
          clientOrganization: { select: { name: true, id: true } },
          checklistTemplates: { where: { isActive: true } },
        },
      },
      assignedWorker: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      assignedWorkforceAccount: {
        select: { displayName: true, id: true },
      },
      completion: {
        include: {
          completedByWorker: {
            include: {
              user: { select: { name: true } },
            },
          },
          evidence: { orderBy: { uploadedAt: "asc" } },
        },
      },
      checklistRuns: {
        orderBy: { updatedAt: "desc" },
        include: {
          completedByWorker: {
            include: { user: { select: { name: true } } },
          },
          items: { orderBy: { itemId: "asc" } },
          evidence: { orderBy: { uploadedAt: "asc" } },
          checklistTemplate: {
            select: { id: true, version: true, items: true },
          },
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const checklistTemplate = job.site.checklistTemplates;
  const checklistResults = job.completion?.checklistResults
    ? (job.completion.checklistResults as Record<
        string,
        { result: string; note?: string }
      >)
    : null;

  const statusBadge =
    job.status === "COMPLETED_PENDING_APPROVAL"
      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
      : job.status === "APPROVED_PAYABLE"
      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : job.status === "PAID"
      ? "bg-zinc-600/30 text-zinc-300 border-zinc-500/40"
      : job.status === "CANCELLED"
      ? "bg-red-500/20 text-red-300 border-red-500/40"
      : "bg-blue-500/20 text-blue-300 border-blue-500/40";

  const latestRun = job.checklistRuns[0] ?? null;
  const templateItems =
    (latestRun?.checklistTemplate?.items as Array<{ itemId: string; label: string }>) ?? [];
  const itemsByItemId = new Map(templateItems.map((i) => [i.itemId, i]));

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/admin/clients" className="hover:text-zinc-300">Locations</Link>
          <span>/</span>
          <Link href={`/admin/clients/${job.site.clientOrganization.id}`} className="hover:text-zinc-300">
            {job.site.clientOrganization.name}
          </Link>
          <span>/</span>
          <Link href={`/admin/jobs?siteId=${job.site.id}`} className="hover:text-zinc-300">
            {job.site.name}
          </Link>
          <span>/</span>
          <span className="text-zinc-400">Job</span>
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{job.site.name}</h1>
          <p className="text-zinc-400">{job.site.address}</p>
          <p className="mt-1 text-sm text-zinc-500">
            Scheduled: {new Date(job.scheduledStart).toLocaleString()} • Payout: $
            {(job.payoutAmountCents / 100).toFixed(2)}
          </p>
        </div>
        <span className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${statusBadge}`}>
          {job.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Assigned to */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xl sm:p-6">
        <h2 className="text-sm font-medium text-zinc-400">Assigned to</h2>
        <p className="mt-1 text-white">
          {job.assignedWorker
            ? `${job.assignedWorker.user.name} (${job.assignedWorker.user.email})`
            : job.assignedWorkforceAccount
            ? job.assignedWorkforceAccount.displayName
            : "—"}
        </p>
      </div>

      {/* Checklist run (Phase 4: run-based completion) */}
      {latestRun && (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-white">Checklist run</h2>
            <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-300">
              <span
                className={`rounded-full border px-2.5 py-1 font-medium ${
                  latestRun.status === "Submitted"
                    ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                    : latestRun.status === "Approved"
                    ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                    : latestRun.status === "Rejected"
                    ? "border-red-500/40 bg-red-500/20 text-red-300"
                    : "border-zinc-500/40 bg-zinc-500/20 text-zinc-300"
                }`}
              >
                {latestRun.status}
              </span>
              <span>Completed by: {latestRun.completedByWorker.user.name}</span>
              {latestRun.submittedAt && (
                <span>Submitted: {new Date(latestRun.submittedAt).toLocaleString()}</span>
              )}
              {latestRun.approvedAt && (
                <span>Approved: {new Date(latestRun.approvedAt).toLocaleString()}</span>
              )}
              <span>Template v{latestRun.templateVersion}</span>
            </div>
          </div>

          {/* Run items */}
          {latestRun.items.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-white">Checklist items</h2>
              <ul className="space-y-3">
                {latestRun.items.map((ri) => {
                  const label = itemsByItemId.get(ri.itemId)?.label ?? ri.itemId;
                  return (
                    <li
                      key={ri.id}
                      className="flex flex-col gap-1 border-b border-zinc-800 pb-3 last:border-b-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-medium text-zinc-200">{label}</span>
                        <span
                          className={`text-sm font-semibold ${
                            ri.result === "PASS"
                              ? "text-emerald-400"
                              : ri.result === "FAIL"
                              ? "text-red-400"
                              : "text-zinc-500"
                          }`}
                        >
                          {ri.result}
                        </span>
                      </div>
                      {(ri.failReason || ri.note) && (
                        <p className="text-xs text-zinc-500">
                          {ri.failReason && <span>Fail reason: {ri.failReason}. </span>}
                          {ri.note && <span>Note: {ri.note}</span>}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Run evidence */}
          {latestRun.evidence.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Photo evidence ({latestRun.evidence.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {latestRun.evidence.map((ev) => (
                  <a
                    key={ev.id}
                    href={`/api/evidence/${ev.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-zinc-700"
                  >
                    <img
                      src={`/api/evidence/${ev.id}`}
                      alt={ev.itemId ? `Evidence ${ev.itemId}` : "Evidence"}
                      className="h-32 w-full object-cover"
                    />
                    {ev.itemId && (
                      <p className="bg-zinc-800 px-2 py-1 text-xs text-zinc-400">{ev.itemId}</p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Admin actions when we have a run (use completion for approve/reject) */}
        </>
      )}

      {/* Legacy completion (no run) & actions */}
      {job.completion && !latestRun && (
        <>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-white">Completion</h2>
            <p className="text-sm text-zinc-300">
              Completed by: {job.completion.completedByWorker.user.name} on{" "}
              {new Date(job.completion.completedAt).toLocaleString()}
            </p>
            {job.completion.notes && (
              <p className="mt-2 text-sm text-zinc-400">Notes: {job.completion.notes}</p>
            )}
          </div>

          {checklistTemplate && checklistResults && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-white">Checklist results</h2>
              <ul className="space-y-2">
                {(checklistTemplate.items as Array<{ itemId: string; label: string }>).map(
                  (item) => {
                    const result = checklistResults[item.itemId];
                    return (
                      <li
                        key={item.itemId}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2 last:border-b-0"
                      >
                        <span className="text-sm text-zinc-300">{item.label}</span>
                        <span
                          className={`text-sm font-medium ${
                            result?.result === "PASS"
                              ? "text-emerald-400"
                              : result?.result === "FAIL"
                              ? "text-red-400"
                              : "text-zinc-500"
                          }`}
                        >
                          {result?.result ?? "—"}
                          {result?.note && `: ${result.note}`}
                        </span>
                      </li>
                    );
                  }
                )}
              </ul>
            </div>
          )}

          {job.completion.evidence.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-white">
                Photo evidence ({job.completion.evidence.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {job.completion.evidence.map((ev) => (
                  <a
                    key={ev.id}
                    href={`/api/evidence/${ev.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded-lg border border-zinc-700"
                  >
                    <img
                      src={`/api/evidence/${ev.id}`}
                      alt="Evidence"
                      className="h-32 w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Admin actions: Approve / Reject / Cancel */}
      {(job.completion || latestRun) && (
        <JobAdminActions
          jobId={job.id}
          status={job.status}
          canApproveReject={job.status === "COMPLETED_PENDING_APPROVAL"}
          canCancel={job.status === "SCHEDULED" || job.status === "COMPLETED_PENDING_APPROVAL"}
        />
      )}

      {/* Actions when no completion yet (e.g. cancel only) */}
      {!job.completion && job.status === "SCHEDULED" && (
        <JobAdminActions
          jobId={job.id}
          status={job.status}
          canApproveReject={false}
          canCancel
        />
      )}

      {!job.completion && !latestRun && job.status === "SCHEDULED" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-400">
          No completion submitted yet.
        </div>
      )}
    </div>
  );
}
