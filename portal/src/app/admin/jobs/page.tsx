import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminJobsPage() {
  await requireAdmin();

  const jobs = await prisma.job.findMany({
    where: { status: { not: "CANCELLED" } },
    include: {
      site: { select: { name: true, address: true } },
      assignedWorker: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      assignedWorkforceAccount: {
        select: { displayName: true },
      },
      completion: {
        select: { id: true, completedAt: true, isDraft: true },
      },
    },
    orderBy: { scheduledStart: "desc" },
    take: 100,
  });

  const statusColor: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    COMPLETED_PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
    APPROVED_PAYABLE: "bg-green-100 text-green-800",
    PAID: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <p className="text-gray-600">Manage and review job completions</p>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Payout
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="font-medium text-gray-900 hover:underline"
                    >
                      {job.site.name}
                    </Link>
                    <div className="text-xs text-gray-500">{job.site.address}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {new Date(job.scheduledStart).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {job.assignedWorker
                      ? job.assignedWorker.user.name
                      : job.assignedWorkforceAccount?.displayName ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        statusColor[job.status] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {job.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    ${(job.payoutAmountCents / 100).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {jobs.length === 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">No jobs yet.</p>
        </div>
      )}
    </div>
  );
}
