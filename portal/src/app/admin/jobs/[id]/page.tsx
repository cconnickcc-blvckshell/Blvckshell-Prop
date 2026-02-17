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
          checklistTemplates: {
            where: { isActive: true },
            orderBy: { version: "desc" },
            take: 1,
          },
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
    },
  });

  if (!job) {
    notFound();
  }

  const checklistTemplate = job.site.checklistTemplates[0];
  const checklistResults = job.completion?.checklistResults
    ? (job.completion.checklistResults as Record<
        string,
        { result: string; note?: string }
      >)
    : null;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{job.site.name}</h1>
          <p className="text-gray-600">{job.site.address}</p>
          <p className="mt-1 text-sm text-gray-500">
            Scheduled: {new Date(job.scheduledStart).toLocaleString()} • Payout: $
            {(job.payoutAmountCents / 100).toFixed(2)}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            job.status === "COMPLETED_PENDING_APPROVAL"
              ? "bg-yellow-100 text-yellow-800"
              : job.status === "APPROVED_PAYABLE"
              ? "bg-green-100 text-green-800"
              : job.status === "PAID"
              ? "bg-gray-100 text-gray-800"
              : job.status === "CANCELLED"
              ? "bg-red-100 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {job.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Assigned to */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h2 className="text-sm font-medium text-gray-500">Assigned to</h2>
        <p className="mt-1 text-gray-900">
          {job.assignedWorker
            ? `${job.assignedWorker.user.name} (${job.assignedWorker.user.email})`
            : job.assignedWorkforceAccount
            ? job.assignedWorkforceAccount.displayName
            : "—"}
        </p>
      </div>

      {/* Completion & actions */}
      {job.completion && (
        <>
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Completion
            </h2>
            <p className="text-sm text-gray-600">
              Completed by: {job.completion.completedByWorker.user.name} on{" "}
              {new Date(job.completion.completedAt).toLocaleString()}
            </p>
            {job.completion.notes && (
              <p className="mt-2 text-sm text-gray-600">Notes: {job.completion.notes}</p>
            )}
          </div>

          {/* Checklist results */}
          {checklistTemplate && checklistResults && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Checklist Results
              </h2>
              <ul className="space-y-2">
                {(checklistTemplate.items as Array<{ itemId: string; label: string }>).map(
                  (item) => {
                    const result = checklistResults[item.itemId];
                    return (
                      <li
                        key={item.itemId}
                        className="flex items-center justify-between border-b pb-2 last:border-b-0"
                      >
                        <span className="text-sm text-gray-900">{item.label}</span>
                        <span
                          className={`text-sm font-medium ${
                            result?.result === "PASS"
                              ? "text-green-600"
                              : result?.result === "FAIL"
                              ? "text-red-600"
                              : "text-gray-500"
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

          {/* Evidence photos */}
          {job.completion.evidence.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Photo Evidence ({job.completion.evidence.length})
              </h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {job.completion.evidence.map((ev) => (
                  <a
                    key={ev.id}
                    href={`/api/evidence/${ev.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block overflow-hidden rounded border"
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

          {/* Admin actions: Approve / Reject / Cancel */}
          <JobAdminActions
            jobId={job.id}
            status={job.status}
            canApproveReject={job.status === "COMPLETED_PENDING_APPROVAL"}
            canCancel={job.status === "SCHEDULED" || job.status === "COMPLETED_PENDING_APPROVAL"}
          />
        </>
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

      {!job.completion && job.status === "SCHEDULED" && (
        <div className="rounded-lg bg-gray-50 p-6 text-center text-gray-600">
          No completion submitted yet.
        </div>
      )}
    </div>
  );
}
