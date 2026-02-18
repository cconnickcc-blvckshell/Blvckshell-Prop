import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreatePayoutBatchForm from "@/components/admin/CreatePayoutBatchForm";
import MarkBatchPaidButton from "@/components/admin/MarkBatchPaidButton";

export default async function PayoutsPage() {
  await requireAdmin();

  const batches = await prisma.payoutBatch.findMany({
    include: {
      payoutLines: {
        include: {
          workforceAccount: { select: { displayName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const approvedJobs = await prisma.job.findMany({
    where: { status: "APPROVED_PAYABLE" },
    include: {
      site: { select: { name: true } },
      assignedWorkforceAccount: { select: { displayName: true, id: true } },
      assignedWorker: {
        include: {
          workforceAccount: { select: { displayName: true, id: true } },
        },
      },
    },
  });

  const statusColor: Record<string, string> = {
    CALCULATED: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    APPROVED: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    RELEASED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    PAID: "bg-zinc-600/30 text-zinc-300 border-zinc-500/40",
  };

  const workforceName = (job: (typeof approvedJobs)[0]) =>
    job.assignedWorkforceAccount?.displayName ??
    job.assignedWorker?.workforceAccount.displayName ??
    "—";

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Payouts</h1>
        <p className="mt-1 text-zinc-400">Payout batches and approved jobs</p>
      </div>

      <CreatePayoutBatchForm />

      {/* Jobs ready for payout */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <h2 className="border-b border-zinc-800 px-4 py-4 text-lg font-semibold text-white sm:px-6">
          Jobs Ready for Payout
          <span className="ml-2 text-sm font-normal text-zinc-500">(APPROVED_PAYABLE)</span>
        </h2>
        <div className="overflow-x-auto">
          {/* Desktop table */}
          <table className="min-w-full divide-y divide-zinc-800 hidden md:table">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Workforce
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {approvedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-white">
                    {job.site.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {workforceName(job)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    ${(job.payoutAmountCents / 100).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      View job
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Mobile cards */}
          <div className="divide-y divide-zinc-800 md:hidden">
            {approvedJobs.map((job) => (
              <div key={job.id} className="flex flex-col gap-2 px-4 py-4">
                <p className="font-medium text-white">{job.site.name}</p>
                <p className="text-sm text-zinc-400">{workforceName(job)}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-400">
                    ${(job.payoutAmountCents / 100).toFixed(2)}
                  </span>
                  <Link
                    href={`/admin/jobs/${job.id}`}
                    className="text-sm font-medium text-zinc-300 hover:text-white"
                  >
                    View job →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        {approvedJobs.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No jobs in APPROVED_PAYABLE status.
          </div>
        )}
      </section>

      {/* Payout batches */}
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <h2 className="border-b border-zinc-800 px-4 py-4 text-lg font-semibold text-white sm:px-6">
          Payout Batches
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800 hidden md:table">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Lines
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {batches.map((batch) => {
                const totalCents = batch.payoutLines.reduce(
                  (sum, line) => sum + line.amountCents,
                  0
                );
                return (
                  <tr key={batch.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                      {new Date(batch.periodStart).toLocaleDateString()} –{" "}
                      {new Date(batch.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          statusColor[batch.status] ?? "bg-zinc-600/30 text-zinc-300 border-zinc-500/40"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                      {batch.payoutLines.length} line(s) • $
                      {(totalCents / 100).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-400">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <MarkBatchPaidButton batchId={batch.id} status={batch.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Mobile cards for batches */}
          <div className="divide-y divide-zinc-800 md:hidden">
            {batches.map((batch) => {
              const totalCents = batch.payoutLines.reduce(
                (sum, line) => sum + line.amountCents,
                0
              );
              return (
                <div key={batch.id} className="flex flex-col gap-2 px-4 py-4">
                  <p className="text-sm text-white">
                    {new Date(batch.periodStart).toLocaleDateString()} –{" "}
                    {new Date(batch.periodEnd).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        statusColor[batch.status] ?? "bg-zinc-600/30 text-zinc-300 border-zinc-500/40"
                      }`}
                    >
                      {batch.status}
                    </span>
                    <span className="text-sm text-zinc-400">
                      {batch.payoutLines.length} line(s) • ${(totalCents / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-1">
                    <MarkBatchPaidButton batchId={batch.id} status={batch.status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {batches.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No payout batches yet. Use the form above to create a batch from approved jobs, then mark it paid.
          </div>
        )}
      </section>
    </div>
  );
}
