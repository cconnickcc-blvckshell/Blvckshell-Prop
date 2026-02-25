import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import JobMapView from "@/components/worker/JobMapView";

export default async function MapPage() {
  const user = await requireWorker();

  const whereClause =
    user.role === "VENDOR_OWNER"
      ? { assignedWorkforceAccountId: user.workforceAccountId!, status: { not: "CANCELLED" as const } }
      : { assignedWorkerId: user.workerId!, status: { not: "CANCELLED" as const } };

  const jobs = await prisma.job.findMany({
    where: whereClause,
    select: {
      id: true,
      scheduledStart: true,
      status: true,
      site: { select: { name: true, address: true, lat: true, lng: true } },
    },
    orderBy: { scheduledStart: "asc" },
    take: 50,
  });

  const markers = jobs
    .filter((j) => j.site.lat != null && j.site.lng != null)
    .map((j) => ({
      id: j.id,
      lat: j.site.lat!,
      lng: j.site.lng!,
      name: j.site.name,
      address: j.site.address,
      status: j.status,
      scheduledStart: j.scheduledStart.toISOString(),
    }));

  const hasCoords = markers.length > 0;

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white">Job Map</h1>
          <p className="text-sm text-zinc-400">Your job sites</p>
        </div>
        {!hasCoords ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <p className="text-zinc-400">No job sites have coordinates set yet.</p>
            <p className="mt-2 text-xs text-zinc-500">Ask your admin to add GPS coordinates to site locations.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 overflow-hidden shadow-xl" style={{ height: "60vh" }}>
            <JobMapView markers={markers} />
          </div>
        )}

        {/* Job list below map */}
        <div className="mt-4 space-y-2">
          {jobs.map((job) => (
            <a
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 hover:border-zinc-700"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{job.site.name}</p>
                <p className="text-xs text-zinc-500 truncate">{job.site.address}</p>
              </div>
              <span className={`shrink-0 h-2.5 w-2.5 rounded-full ${
                job.status === "SCHEDULED" ? "bg-blue-400" :
                job.status === "COMPLETED_PENDING_APPROVAL" ? "bg-amber-400" :
                job.status === "APPROVED_PAYABLE" ? "bg-emerald-400" : "bg-zinc-500"
              }`} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
