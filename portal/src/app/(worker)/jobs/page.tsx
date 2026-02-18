import { redirect } from "next/navigation";
import { getCurrentUser, requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function JobsPage() {
  const user = await requireWorker();

  // VENDOR_OWNER: jobs assigned to their workforce account; workers: jobs assigned to them
  const whereClause =
    user.role === "VENDOR_OWNER"
      ? { assignedWorkforceAccountId: user.workforceAccountId!, status: { not: "CANCELLED" as const } }
      : { assignedWorkerId: user.workerId!, status: { not: "CANCELLED" as const } };

  const jobs = await prisma.job.findMany({
    where: whereClause,
    include: {
      site: {
        select: {
          name: true,
          address: true,
        },
      },
      completion: {
        select: {
          id: true,
          isDraft: true,
          completedAt: true,
        },
      },
    },
    orderBy: {
      scheduledStart: "asc",
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED_PENDING_APPROVAL":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED_PAYABLE":
        return "bg-green-100 text-green-800";
      case "PAID":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-gray-600">View and complete your assigned jobs</p>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-gray-500">No jobs assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block rounded-lg bg-white p-6 shadow transition hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {job.site.name}
                    </h2>
                    <p className="text-sm text-gray-600">{job.site.address}</p>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>
                        Scheduled:{" "}
                        {new Date(job.scheduledStart).toLocaleDateString()}{" "}
                        {new Date(job.scheduledStart).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {job.completion && (
                        <span className="text-xs">
                          {job.completion.isDraft
                            ? "Draft saved"
                            : `Completed: ${new Date(job.completion.completedAt).toLocaleDateString()}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(job.status)}`}
                    >
                      {job.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
