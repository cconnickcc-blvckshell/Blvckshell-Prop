import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BulkJobActionsPanel from "@/components/admin/BulkJobActionsPanel";
import { runFlagOverdueApprovals } from "@/server/actions/bulk-actions";

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ siteId?: string }>;
}) {
  await requireAdmin();
  // Non-blocking: flag overdue approvals (skip if migration not run — avoids 500)
  void runFlagOverdueApprovals().catch(() => {});

  const { siteId } = await searchParams;

  const jobs = await prisma.job.findMany({
    where: {
      status: { not: "CANCELLED" },
      ...(siteId ? { siteId } : {}),
    },
    select: {
      id: true,
      siteId: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      payoutAmountCents: true,
      assignedWorkforceAccountId: true,
      assignedWorkerId: true,
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
    SCHEDULED: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    COMPLETED_PENDING_APPROVAL: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    APPROVED_PAYABLE: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    PAID: "bg-zinc-600/30 text-zinc-300 border-zinc-500/40",
  };

  const assignedLabel = (job: (typeof jobs)[0]) =>
    job.assignedWorker
      ? job.assignedWorker.user.name
      : job.assignedWorkforceAccount?.displayName ?? "—";

  let siteName: string | null = null;
  if (siteId) {
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: { name: true },
    });
    siteName = site?.name ?? null;
  }

  return (
    <div className="w-full">
      <BulkJobActionsPanel jobs={jobs.map((j) => ({ id: j.id, status: j.status }))} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {siteName ? `Jobs — ${siteName}` : "Jobs"}
          </h1>
          <p className="mt-1 text-zinc-400">
            {siteName ? "Job history for this site" : "Manage and review job completions"}
          </p>
        </div>
        <Link
          href="/admin/jobs/new"
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Create job
        </Link>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800 hidden md:table">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Payout
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="font-medium text-white hover:text-emerald-400"
                    >
                      {job.site.name}
                    </Link>
                    <div className="text-xs text-zinc-500">{job.site.address}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {new Date(job.scheduledStart).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {assignedLabel(job)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        statusColor[job.status] ?? "bg-zinc-600/30 text-zinc-300 border-zinc-500/40"
                      }`}
                    >
                      {job.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    ${(job.payoutAmountCents / 100).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="divide-y divide-zinc-800 md:hidden">
            {jobs.map((job) => (
              <div key={job.id} className="flex flex-col gap-2 px-4 py-4">
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="font-medium text-white hover:text-emerald-400"
                >
                  {job.site.name}
                </Link>
                <p className="text-xs text-zinc-500">{job.site.address}</p>
                <p className="text-sm text-zinc-400">{new Date(job.scheduledStart).toLocaleString()}</p>
                <p className="text-sm text-zinc-300">{assignedLabel(job)}</p>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      statusColor[job.status] ?? "bg-zinc-600/30 text-zinc-300 border-zinc-500/40"
                    }`}
                  >
                    {job.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm font-medium text-emerald-400">
                    ${(job.payoutAmountCents / 100).toFixed(2)}
                  </span>
                </div>
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="text-sm font-medium text-zinc-300 hover:text-white"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
        {jobs.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-500 mb-4">No jobs yet.</p>
            <Link
              href="/admin/jobs/new"
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Create your first job
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
