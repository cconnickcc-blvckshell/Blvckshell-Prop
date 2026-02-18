import { requireVendorOwner } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function VendorJobsPage() {
  const user = await requireVendorOwner();
  if (!user.workforceAccountId) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-gray-600">No workforce account linked.</p>
      </div>
    );
  }

  const jobs = await prisma.job.findMany({
    where: { assignedWorkforceAccountId: user.workforceAccountId },
    include: {
      site: { select: { name: true } },
      assignedWorker: {
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { scheduledStart: "desc" },
    take: 50,
  });

  const statusColor: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    COMPLETED_PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
    APPROVED_PAYABLE: "bg-green-100 text-green-800",
    PAID: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Vendor Jobs</h1>
        <p className="text-gray-600">Jobs assigned to your company (read-only; no pricing or approvals here)</p>
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
                  Assigned to
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {job.site.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {job.assignedWorker?.user.name ?? "Unassigned"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {new Date(job.scheduledStart).toLocaleString()}
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
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      href={`/jobs/${job.id}`}
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
        {jobs.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            No jobs assigned to your company yet.
          </div>
        )}
      </div>
    </div>
  );
}
