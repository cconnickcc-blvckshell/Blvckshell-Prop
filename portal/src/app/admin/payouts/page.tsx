import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

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
    CALCULATED: "bg-blue-100 text-blue-800",
    APPROVED: "bg-amber-100 text-amber-800",
    RELEASED: "bg-green-100 text-green-800",
    PAID: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="text-gray-600">Payout batches and approved jobs</p>
      </div>

      {/* Approved jobs (ready for payout) */}
      <div className="rounded-lg bg-white shadow">
        <h2 className="border-b px-6 py-4 text-lg font-semibold text-gray-900">
          Jobs Ready for Payout (APPROVED_PAYABLE)
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Workforce
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {approvedJobs.map((job) => (
                <tr key={job.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {job.site.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {job.assignedWorkforceAccount?.displayName ??
                      job.assignedWorker?.workforceAccount.displayName ??
                      "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    ${(job.payoutAmountCents / 100).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      View job
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {approvedJobs.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">
            No jobs in APPROVED_PAYABLE status.
          </div>
        )}
      </div>

      {/* Payout batches */}
      <div className="rounded-lg bg-white shadow">
        <h2 className="border-b px-6 py-4 text-lg font-semibold text-gray-900">
          Payout Batches
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Lines
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {batches.map((batch) => {
                const totalCents = batch.payoutLines.reduce(
                  (sum, line) => sum + line.amountCents,
                  0
                );
                return (
                  <tr key={batch.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {new Date(batch.periodStart).toLocaleDateString()} –{" "}
                      {new Date(batch.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          statusColor[batch.status] ?? "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {batch.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {batch.payoutLines.length} line(s) • $
                      {(totalCents / 100).toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {new Date(batch.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {batches.length === 0 && (
          <div className="p-6 text-center text-sm text-gray-500">
            No payout batches yet. Create a batch from approved jobs (mark as PAID
            via batch — implement create batch + mark paid in next iteration).
          </div>
        )}
      </div>
    </div>
  );
}
