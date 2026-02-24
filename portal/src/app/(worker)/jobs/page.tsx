import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import JobsWeekStrip from "@/components/worker/JobsWeekStrip";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireWorker();
  const params = await searchParams;

  const whereClause =
    user.role === "VENDOR_OWNER"
      ? { assignedWorkforceAccountId: user.workforceAccountId!, status: { not: "CANCELLED" as const } }
      : { assignedWorkerId: user.workerId!, status: { not: "CANCELLED" as const } };

  const jobs = await prisma.job.findMany({
    where: whereClause,
    select: {
      id: true,
      scheduledStart: true,
      scheduledEnd: true,
      status: true,
      checkedInAt: true,
      site: {
        select: {
          name: true,
          address: true,
          estimatedDurationMinutes: true,
          serviceWindow: true,
        },
      },
      completion: {
        select: {
          id: true,
          isDraft: true,
          completedAt: true,
        },
      },
    },
    orderBy: { scheduledStart: "asc" },
  });

  const selectedDate = params.date ?? new Date().toISOString().split("T")[0];

  const filteredJobs = params.date
    ? jobs.filter((j) => new Date(j.scheduledStart).toISOString().split("T")[0] === params.date)
    : jobs;

  const jobDates = [...new Set(jobs.map((j) => new Date(j.scheduledStart).toISOString().split("T")[0]))];

  const statusStyle: Record<string, string> = {
    SCHEDULED: "border-blue-500/40 bg-blue-500/20 text-blue-300",
    COMPLETED_PENDING_APPROVAL: "border-amber-500/40 bg-amber-500/20 text-amber-300",
    APPROVED_PAYABLE: "border-emerald-500/40 bg-emerald-500/20 text-emerald-300",
    PAID: "border-zinc-600/40 bg-zinc-600/20 text-zinc-400",
  };

  function getGoogleMapsUrl(address: string) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }

  function getTimeUntil(date: Date) {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 0) return null;
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `in ${Math.floor(hours / 24)}d`;
    if (hours > 0) return `in ${hours}h ${mins}m`;
    return `in ${mins}m`;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white">My Jobs</h1>
          <p className="text-sm text-zinc-400">{filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}</p>
        </div>

        <JobsWeekStrip selectedDate={selectedDate} jobDates={jobDates} />

        {filteredJobs.length === 0 ? (
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-400">No jobs {params.date ? "on this day" : "assigned yet"}.</p>
            {params.date && (
              <Link href="/jobs" className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300">
                Show all jobs
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJobs.map((job) => {
              const timeUntil = getTimeUntil(new Date(job.scheduledStart));
              return (
                <div key={job.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0">
                      <h2 className="font-semibold text-white truncate">{job.site.name}</h2>
                      <p className="mt-0.5 text-sm text-zinc-400 truncate">{job.site.address}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>
                          {new Date(job.scheduledStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {job.site.estimatedDurationMinutes && ` · ${job.site.estimatedDurationMinutes}min`}
                        </span>
                        {timeUntil && (
                          <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-blue-300">
                            {timeUntil}
                          </span>
                        )}
                        {job.completion && (
                          <span className="text-zinc-500">
                            {job.completion.isDraft ? "Draft saved" : "Completed"}
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle[job.status] ?? ""}`}>
                        {job.status === "COMPLETED_PENDING_APPROVAL" ? "PENDING" : job.status.replace(/_/g, " ")}
                      </span>
                      <a
                        href={getGoogleMapsUrl(job.site.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white active:scale-95"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        Navigate
                      </a>
                    </div>
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
