import { requireVendorOwner } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { formatPayoutStatus } from "@/lib/format";

export default async function VendorEarningsPage() {
  const user = await requireVendorOwner();
  if (!user.workforceAccountId) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-zinc-400">No workforce account linked.</p>
      </div>
    );
  }

  const payoutLines = await prisma.payoutLine.findMany({
    where: {
      workforceAccountId: user.workforceAccountId,
    },
    include: {
      payoutBatch: {
        select: {
          id: true,
          periodStart: true,
          periodEnd: true,
          status: true,
        },
      },
    },
    orderBy: {
      payoutBatch: {
        periodStart: "desc",
      },
    },
  });

  const jobIds = payoutLines.map(line => line.jobId).filter((id): id is string => id != null);
  const jobs = jobIds.length > 0 ? await prisma.job.findMany({
    where: { id: { in: jobIds } },
    select: { id: true, status: true },
  }) : [];
  const jobStatusMap = new Map(jobs.map(j => [j.id, j.status]));

  const byPeriod = new Map<
    string,
    {
      periodStart: Date;
      periodEnd: Date;
      batchId: string;
      batchStatus: string;
      totalCents: number;
      paidCents: number;
      pendingCents: number;
      jobCount: number;
    }
  >();

  for (const line of payoutLines) {
    const batch = line.payoutBatch;
    if (!batch) continue;

    const key = batch.id;
    const existing = byPeriod.get(key);
    const amount = line.amountCents;
    const jobStatus = line.jobId ? jobStatusMap.get(line.jobId) : null;
    const isPaid = batch.status === "PAID" || jobStatus === "PAID";

    if (existing) {
      existing.totalCents += amount;
      existing.jobCount += 1;
      if (isPaid) {
        existing.paidCents += amount;
      } else {
        existing.pendingCents += amount;
      }
    } else {
      byPeriod.set(key, {
        periodStart: batch.periodStart,
        periodEnd: batch.periodEnd,
        batchId: batch.id,
        batchStatus: batch.status,
        totalCents: amount,
        paidCents: isPaid ? amount : 0,
        pendingCents: isPaid ? 0 : amount,
        jobCount: 1,
      });
    }
  }

  const periods = Array.from(byPeriod.values()).sort(
    (a, b) => b.periodStart.getTime() - a.periodStart.getTime()
  );

  const totalEarnings = periods.reduce((sum, p) => sum + p.totalCents, 0);
  const totalPaid = periods.reduce((sum, p) => sum + p.paidCents, 0);
  const totalPending = periods.reduce((sum, p) => sum + p.pendingCents, 0);

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Payout Totals</h1>
          <p className="text-zinc-400">Aggregate payout totals by period</p>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
            <p className="text-sm font-medium text-zinc-400">Total Earnings</p>
            <p className="mt-2 text-2xl font-bold text-white">
              ${(totalEarnings / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
            <p className="text-sm font-medium text-zinc-400">Paid</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">
              ${(totalPaid / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
            <p className="text-sm font-medium text-zinc-400">Pending</p>
            <p className="mt-2 text-2xl font-bold text-amber-400">
              ${(totalPending / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Periods List */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
          <div className="border-b border-zinc-800 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">By Period</h2>
          </div>
          <div className="divide-y divide-zinc-800/50">
            {periods.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                No payout periods yet. Jobs will appear here once they are approved and included in payout batches.
              </div>
            ) : (
              periods.map((period) => (
                <div key={period.batchId} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {period.periodStart.toLocaleDateString()} –{" "}
                        {period.periodEnd.toLocaleDateString()}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {period.jobCount} job{period.jobCount !== 1 ? "s" : ""} • Status:{" "}
                        {formatPayoutStatus(period.batchStatus)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">
                        ${(period.totalCents / 100).toFixed(2)}
                      </p>
                      <div className="mt-1 flex gap-2 text-xs">
                        <span className="text-emerald-400">
                          Paid: ${(period.paidCents / 100).toFixed(2)}
                        </span>
                        {period.pendingCents > 0 && (
                          <span className="text-amber-400">
                            Pending: ${(period.pendingCents / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
