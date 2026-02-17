import { redirect, notFound } from "next/navigation";
import { getCurrentUser, requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { canAccessJob } from "@/server/guards/rbac";
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

  return (
    <JobDetailClient
      job={job}
      checklistTemplate={checklistTemplate}
      currentWorkerId={user.workerId!}
      requiredPhotoCount={job.site.requiredPhotoCount}
    />
  );
}
