import { requireVendorOwner } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function VendorJobsPage() {
  const user = await requireVendorOwner();
  if (!user.workforceAccountId) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-zinc-400">No workforce account linked.</p>
      </div>
    );
  }

  const jobs = await prisma.job.findMany({
    where: { assignedWorkforceAccountId: user.workforceAccountId },
    select: {
      id: true,
      scheduledStart: true,
      status: true,
      site: { select: { name: true } },
      assignedWorker: {
        select: { user: { select: { name: true } } },
      },
    },
    orderBy: { scheduledStart: "desc" },
    take: 50,
  });

  const statusColor: Record<string, string> = {
    SCHEDULED: "border-blue-500/40 bg-blue-500/20 text-blue-300",
    COMPLETED_PENDING_APPROVAL: "border-amber-500/40 bg-amber-500/20 text-amber-300",
    APPROVED_PAYABLE: "border-emerald-500/40 bg-emerald-500/20 text-emerald-300",
    PAID: "border-zinc-600/40 bg-zinc-600/20 text-zinc-400",
    CANCELLED: "border-red-500/40 bg-red-500/20 text-red-300",
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vendor Jobs</h1>
        <p className="text-zinc-400">Jobs assigned to your company (read-only; no pricing or approvals here)</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Assigned to
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                    {job.site.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400">
                    {job.assignedWorker?.user.name ?? "Unassigned"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400">
                    {new Date(job.scheduledStart).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${
                        statusColor[job.status] ?? "border-zinc-600/40 bg-zinc-600/20 text-zinc-400"
                      }`}
                    >
                      {job.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-zinc-400 hover:text-white"
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
          <div className="p-6 text-center text-zinc-500">
            No jobs assigned to your company yet.
          </div>
        )}
      </div>
    </div>
  );
}
