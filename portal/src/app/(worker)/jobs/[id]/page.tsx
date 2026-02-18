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

  // Get job with all related data
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      site: {
        include: {
          checklistTemplates: {
            where: { isActive: true },
            orderBy: { version: "desc" },
            take: 1,
          },
          accessCredentials: {
            where: {
              issuedToWorkerId: user.workerId,
              status: "ACTIVE",
            },
          },
        },
      },
      completion: {
        include: {
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-white p-8 shadow">
            <p className="text-gray-600">
              This job is assigned to your organization. Only the assigned worker can complete the checklist. Please log in as that worker or assign the job to yourself from the admin panel.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Job: {job.site.name} — {job.status}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const checklistTemplate = job.site.checklistTemplates[0];
  if (!checklistTemplate) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-white p-8 shadow">
            <p className="text-gray-600">
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-white p-8 shadow">
            <p className="text-gray-600">{runResult.error ?? "Could not load checklist."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <JobDetailClient
      job={job}
      checklistTemplate={checklistTemplate}
      checklistRunId={runResult.run.id}
      initialRunItems={runResult.runItems}
      currentWorkerId={user.workerId}
      requiredPhotoCount={job.site.requiredPhotoCount}
    />
  );
}
