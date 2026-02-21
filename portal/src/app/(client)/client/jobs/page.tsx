import Link from "next/link";
import { requireClient } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function ClientJobsPage() {
  const user = await requireClient();

  const jobs = await prisma.job.findMany({
    where: { site: { clientOrganizationId: user.clientOrganizationId! } },
    orderBy: { scheduledStart: "desc" },
    take: 200,
    select: {
      id: true,
      status: true,
      scheduledStart: true,
      site: { select: { name: true, address: true } },
    },
  });

  const statusLabel: Record<string, string> = {
    SCHEDULED: "Scheduled",
    COMPLETED_PENDING_APPROVAL: "Pending approval",
    APPROVED_PAYABLE: "Approved",
    PAID: "Paid",
    CANCELLED: "Cancelled",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Job history
      </h1>
      <p className="mt-1 text-zinc-400">
        All jobs for your locations. Open a job to view evidence and details.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No jobs yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Site
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Scheduled
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{job.site.name}</p>
                    <p className="text-xs text-zinc-500">{job.site.address}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-300">
                    {new Date(job.scheduledStart).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    {statusLabel[job.status] ?? job.status}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/client/jobs/${job.id}`}
                      className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
