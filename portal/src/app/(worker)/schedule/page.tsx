import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function SchedulePage() {
  const user = await requireWorker();

  const whereClause =
    user.role === "VENDOR_OWNER"
      ? { assignedWorkforceAccountId: user.workforceAccountId!, status: { not: "CANCELLED" as const } }
      : { assignedWorkerId: user.workerId!, status: { not: "CANCELLED" as const } };

  const jobs = await prisma.job.findMany({
    where: {
      ...whereClause,
      scheduledStart: { gte: new Date() },
    },
    select: {
      id: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      site: { select: { name: true, address: true, estimatedDurationMinutes: true } },
    },
    orderBy: { scheduledStart: "asc" },
    take: 50,
  });

  const grouped = new Map<string, typeof jobs>();
  for (const job of jobs) {
    const dateKey = new Date(job.scheduledStart).toLocaleDateString("en-CA");
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(job);
  }

  const statusDot: Record<string, string> = {
    SCHEDULED: "bg-blue-400",
    COMPLETED_PENDING_APPROVAL: "bg-amber-400",
    APPROVED_PAYABLE: "bg-emerald-400",
    PAID: "bg-zinc-500",
  };

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white">Schedule</h1>
          <p className="text-sm text-zinc-400">Upcoming jobs</p>
        </div>

        {grouped.size === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-400">No upcoming jobs scheduled.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(grouped.entries()).map(([dateKey, dayJobs]) => {
              const date = new Date(dateKey + "T12:00:00");
              const isToday = new Date().toLocaleDateString("en-CA") === dateKey;
              const isTomorrow = (() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                return tomorrow.toLocaleDateString("en-CA") === dateKey;
              })();

              return (
                <div key={dateKey}>
                  <div className="mb-2 flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-zinc-300">
                      {isToday ? "Today" : isTomorrow ? "Tomorrow" : date.toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}
                    </h2>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                      {dayJobs.length} job{dayJobs.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayJobs.map((job) => (
                      <Link
                        key={job.id}
                        href={`/jobs/${job.id}`}
                        className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 hover:bg-zinc-800/50 active:scale-[0.98] transition-all"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-semibold text-white">
                            {new Date(job.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {job.site.estimatedDurationMinutes && (
                            <span className="text-[10px] text-zinc-500">{job.site.estimatedDurationMinutes}min</span>
                          )}
                        </div>
                        <div className="h-8 w-px bg-zinc-700" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">{job.site.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{job.site.address}</p>
                        </div>
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot[job.status] ?? "bg-zinc-500"}`} />
                      </Link>
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
