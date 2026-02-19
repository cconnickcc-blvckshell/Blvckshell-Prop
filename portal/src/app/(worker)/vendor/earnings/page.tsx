import { requireVendorOwner } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

/**
 * Vendor earnings page: Shows payout totals by period (D4)
 * Vendor owners see aggregate totals, not per-worker breakdown
 */
export default async function VendorEarningsPage() {
  const user = await requireVendorOwner();
  if (!user.workforceAccountId) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-gray-600">No workforce account linked.</p>
      </div>
    );
  }

  // Get all payout lines for this workforce account
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
      job: {
        select: {
          id: true,
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

  // Group by payout batch period
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
    const isPaid = batch.status === "PAID" || line.job?.status === "PAID";

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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payout Totals</h1>
          <p className="text-gray-600">Aggregate payout totals by period</p>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Total Earnings</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              ${(totalEarnings / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Paid</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              ${(totalPaid / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="mt-2 text-2xl font-bold text-yellow-600">
              ${(totalPending / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Periods List */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">By Period</h2>
          </div>
          <div className="divide-y">
            {periods.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No payout periods yet. Jobs will appear here once they are approved and included in payout batches.
              </div>
            ) : (
              periods.map((period) => (
                <div key={period.batchId} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {period.periodStart.toLocaleDateString()} –{" "}
                        {period.periodEnd.toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {period.jobCount} job{period.jobCount !== 1 ? "s" : ""} • Status:{" "}
                        {period.batchStatus}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(period.totalCents / 100).toFixed(2)}
                      </p>
                      <div className="mt-1 flex gap-2 text-xs">
                        <span className="text-green-600">
                          Paid: ${(period.paidCents / 100).toFixed(2)}
                        </span>
                        {period.pendingCents > 0 && (
                          <span className="text-yellow-600">
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
