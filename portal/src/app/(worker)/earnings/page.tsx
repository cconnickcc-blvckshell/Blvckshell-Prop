import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function EarningsPage() {
  const user = await requireWorker();

  // Get worker's completed and paid jobs
  const jobs = await prisma.job.findMany({
    where: {
      assignedWorkerId: user.workerId,
      status: {
        in: ["APPROVED_PAYABLE", "PAID"],
      },
    },
    include: {
      site: {
        select: {
          name: true,
        },
      },
      completion: {
        select: {
          completedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalEarnings = jobs.reduce((sum, job) => sum + job.payoutAmountCents, 0);
  const paidEarnings = jobs
    .filter((job) => job.status === "PAID")
    .reduce((sum, job) => sum + job.payoutAmountCents, 0);
  const pendingEarnings = totalEarnings - paidEarnings;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-600">View your earnings and payout status</p>
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
              ${(paidEarnings / 100).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="mt-2 text-2xl font-bold text-yellow-600">
              ${(pendingEarnings / 100).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Jobs List */}
        <div className="rounded-lg bg-white shadow">
          <div className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Job History</h2>
          </div>
          <div className="divide-y">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No earnings yet. Complete jobs to see earnings here.
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{job.site.name}</p>
                      <p className="text-sm text-gray-600">
                        Completed:{" "}
                        {job.completion?.completedAt
                          ? new Date(job.completion.completedAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(job.payoutAmountCents / 100).toFixed(2)}
                      </p>
                      <p
                        className={`text-xs font-medium ${
                          job.status === "PAID"
                            ? "text-green-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {job.status === "PAID" ? "Paid" : "Pending"}
                      </p>
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
