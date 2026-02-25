import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function EarningsPage() {
  const user = await requireWorker();

  const jobs = await prisma.job.findMany({
    where: {
      assignedWorkerId: user.workerId,
      status: { in: ["APPROVED_PAYABLE", "PAID"] },
    },
    select: {
      id: true,
      status: true,
      payoutAmountCents: true,
      scheduledStart: true,
      site: { select: { name: true } },
      completion: { select: { completedAt: true } },
    },
    orderBy: { scheduledStart: "desc" },
  });

  const totalEarnings = jobs.reduce((sum, j) => sum + j.payoutAmountCents, 0);
  const paidEarnings = jobs.filter((j) => j.status === "PAID").reduce((sum, j) => sum + j.payoutAmountCents, 0);
  const pendingEarnings = totalEarnings - paidEarnings;

  const byMonth = new Map<string, typeof jobs>();
  for (const job of jobs) {
    const d = new Date(job.scheduledStart);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(job);
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white">Earnings</h1>
          <p className="text-sm text-zinc-400">Your payout history</p>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-lg font-bold text-white">${(totalEarnings / 100).toFixed(0)}</p>
            <p className="text-[10px] text-zinc-500">Total</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-lg font-bold text-emerald-400">${(paidEarnings / 100).toFixed(0)}</p>
            <p className="text-[10px] text-zinc-500">Paid</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-lg font-bold text-amber-400">${(pendingEarnings / 100).toFixed(0)}</p>
            <p className="text-[10px] text-zinc-500">Pending</p>
          </div>
        </div>

        {/* Pay periods */}
        {byMonth.size === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-400">No earnings yet. Complete jobs to see earnings here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.from(byMonth.entries()).map(([monthKey, monthJobs]) => {
              const [year, month] = monthKey.split("-");
              const monthLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en", { month: "long", year: "numeric" });
              const monthTotal = monthJobs.reduce((s, j) => s + j.payoutAmountCents, 0);
              const monthPaid = monthJobs.filter((j) => j.status === "PAID").reduce((s, j) => s + j.payoutAmountCents, 0);

              return (
                <div key={monthKey} className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
                  <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
                    <div>
                      <h2 className="font-semibold text-white">{monthLabel}</h2>
                      <p className="text-xs text-zinc-500">{monthJobs.length} job{monthJobs.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-white">${(monthTotal / 100).toFixed(2)}</p>
                        {monthPaid < monthTotal && (
                          <p className="text-xs text-amber-400">${((monthTotal - monthPaid) / 100).toFixed(2)} pending</p>
                        )}
                      </div>
                      <a
                        href={`/api/worker/paystub?month=${monthKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Download statement
                      </a>
                    </div>
                  </div>
                  <div className="divide-y divide-zinc-800/50">
                    {monthJobs.map((job) => (
                      <div key={job.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-200 truncate">{job.site.name}</p>
                          <p className="text-xs text-zinc-500">
                            {new Date(job.scheduledStart).toLocaleDateString("en", { month: "short", day: "numeric" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-medium text-zinc-200">${(job.payoutAmountCents / 100).toFixed(2)}</span>
                          <span className={`h-2 w-2 rounded-full ${job.status === "PAID" ? "bg-emerald-400" : "bg-amber-400"}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
