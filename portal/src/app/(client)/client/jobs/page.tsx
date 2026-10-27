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
      {jobs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center text-sm text-zinc-500">
          No jobs yet.
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3 lg:hidden">
            {jobs.map((job) => (
              <li key={job.id}>
                <Link
                  href={`/client/jobs/${job.id}`}
                  className="block min-h-11 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{job.site.name}</p>
                      <p className="truncate text-sm text-zinc-500">{job.site.address}</p>
                      <p className="mt-2 text-sm text-zinc-300">
                        {new Date(job.scheduledStart).toLocaleString()}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200">
                      {statusLabel[job.status] ?? job.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6 hidden overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl lg:block">
          <div className="overflow-x-auto">
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
          </div>
          </div>
        </>
      )}
    </div>
  );
}
