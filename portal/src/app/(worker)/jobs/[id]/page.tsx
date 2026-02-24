import { redirect, notFound } from "next/navigation";
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

  // Only show jobs in SCHEDULED or COMPLETED_PENDING_APPROVAL status
  if (job.status !== "SCHEDULED" && job.status !== "COMPLETED_PENDING_APPROVAL") {
    redirect("/jobs");
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
