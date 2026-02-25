import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { canAccessJob } from "@/server/guards/rbac";
import { createOrGetChecklistRun } from "@/server/actions/checklist-run-actions";
import JobDetailClient from "@/components/JobDetailClient";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireWorker();

  // Check access
  const hasAccess = await canAccessJob(user, params.id);
  if (!hasAccess) {
    notFound();
  }

  // Get job with related data; explicit select avoids Category A columns (approvalFlaggedAt, jobTemplateId, jobTemplateVersion; siteTemplateId, siteTemplateVersion)
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      siteId: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      payoutAmountCents: true,
      assignedWorkforceAccountId: true,
      assignedWorkerId: true,
      isMissed: true,
      missedReason: true,
      makeGoodJobId: true,
      startedAt: true,
      endedAt: true,
      actualDurationMinutes: true,
      checkInMethod: true,
      createdAt: true,
      pricingModel: true,
      billableAmountCents: true,
      billableStatus: true,
      invoiceId: true,
      approvedAt: true,
      approvedById: true,
      site: {
        select: {
          name: true,
          address: true,
          accessInstructions: true,
          requiredPhotoCount: true,
          checklistTemplates: true,
          accessCredentials: {
            where: {
              issuedToWorkerId: user.workerId,
              status: "ACTIVE",
            },
          },
        },
      },
      completion: {
        select: {
          id: true,
          jobId: true,
          completedByWorkerId: true,
          completedAt: true,
          checklistResults: true,
          notes: true,
          isDraft: true,
          evidence: {
            orderBy: { uploadedAt: "asc" },
          },
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  // Redirect only for cancelled jobs
  if (job.status === "CANCELLED") {
    redirect("/jobs");
  }

  // Read-only view for completed states (APPROVED_PAYABLE, PAID)
  if (job.status === "APPROVED_PAYABLE" || job.status === "PAID") {
    const statusLabel = job.status === "PAID" ? "Paid" : "Approved";
    const statusColor = job.status === "PAID" ? "text-zinc-300 bg-zinc-600/30 border-zinc-500/40" : "text-emerald-300 bg-emerald-500/20 border-emerald-500/40";
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-lg space-y-4">
          <Link href="/jobs" className="text-sm text-zinc-400 hover:text-zinc-200">← Back to jobs</Link>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-white">{job.site.name}</h1>
              <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Address</span>
                <span className="text-zinc-200">{job.site.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Scheduled</span>
                <span className="text-zinc-200">
                  {new Date(job.scheduledStart).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </div>
              {job.completion?.completedAt && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Completed</span>
                  <span className="text-zinc-200">
                    {new Date(job.completion.completedAt).toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-400">Payout</span>
                <span className="font-medium text-emerald-400">${(job.payoutAmountCents / 100).toFixed(2)}</span>
              </div>
              {job.actualDurationMinutes && (
                <div className="flex justify-between">
                  <span className="text-zinc-400">Duration</span>
                  <span className="text-zinc-200">{job.actualDurationMinutes} min</span>
                </div>
              )}
            </div>
            {job.completion?.notes && (
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3">
                <p className="text-xs font-medium text-zinc-500 mb-1">Notes</p>
                <p className="text-sm text-zinc-300">{job.completion.notes}</p>
              </div>
            )}
            {job.completion?.evidence && job.completion.evidence.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-zinc-500 mb-2">Evidence ({job.completion.evidence.length} photo{job.completion.evidence.length !== 1 ? "s" : ""})</p>
                <div className="grid grid-cols-2 gap-2">
                  {job.completion.evidence.map((e) => (
                    <div key={e.id} className="rounded-lg border border-zinc-800 bg-zinc-800/30 p-2 text-center text-xs text-zinc-500">
                      {e.fileType}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Only the assigned worker can complete the job (must have workerId)
  if (!user.workerId) {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-8 shadow-xl">
            <p className="text-zinc-400">
              This job is assigned to your organization. Only the assigned worker can complete the checklist. Please log in as that worker or assign the job to yourself from the admin panel.
            </p>
            <p className="mt-4 text-sm text-zinc-500">
              Job: {job.site.name} — {job.status}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const checklistTemplate = job.site.checklistTemplates?.find((t) => t.isActive) ?? null;
  if (!checklistTemplate) {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-8 shadow-xl">
            <p className="text-zinc-400">
              No checklist template available for this site. Please contact admin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Create or get the checklist run (DB-backed execution instance)
  const runResult = await createOrGetChecklistRun(job.id);
  if (!runResult.success || !runResult.run) {
    return (
      <div className="min-h-screen p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-zinc-900/50 border border-zinc-800 p-8 shadow-xl">
            <p className="text-zinc-400">{runResult.error ?? "Could not load checklist."}</p>
          </div>
        </div>
      </div>
    );
  }

  // Gold Standard: Prefer run snapshot for checklist items so template edits don't affect in-progress run.
  const checklistItemsForRun =
    runResult.templateSnapshot && Array.isArray(runResult.templateSnapshot)
      ? runResult.templateSnapshot
      : checklistTemplate.items;

  return (
    <JobDetailClient
      job={job}
      checklistTemplate={{ ...checklistTemplate, items: checklistItemsForRun }}
      checklistRunId={runResult.run.id}
      initialRunItems={runResult.runItems}
      currentWorkerId={user.workerId}
      requiredPhotoCount={job.site.requiredPhotoCount}
    />
  );
}
