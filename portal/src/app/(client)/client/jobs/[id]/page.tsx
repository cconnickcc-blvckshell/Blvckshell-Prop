import { notFound } from "next/navigation";
import Link from "next/link";
import { requireClient } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function ClientJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireClient();
  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: {
      id,
      site: { clientOrganizationId: user.clientOrganizationId! },
    },
    include: {
      site: { select: { name: true, address: true } },
      completion: {
        include: {
          evidence: { orderBy: { uploadedAt: "asc" } },
        },
      },
    },
  });

  if (!job) {
    notFound();
  }

  const statusLabel: Record<string, string> = {
    SCHEDULED: "Scheduled",
    COMPLETED_PENDING_APPROVAL: "Pending approval",
    APPROVED_PAYABLE: "Approved",
    PAID: "Paid",
    CANCELLED: "Cancelled",
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/client/jobs"
          className="text-sm font-medium text-zinc-400 hover:text-zinc-200"
        >
          ← Job history
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {job.site.name}
      </h1>
      <p className="mt-1 text-zinc-400">{job.site.address}</p>
      <p className="mt-2 text-sm text-zinc-500">
        Scheduled: {new Date(job.scheduledStart).toLocaleString()} • Status:{" "}
        {statusLabel[job.status] ?? job.status}
      </p>

      {/* Evidence (read-only) */}
      {job.completion && job.completion.evidence.length > 0 && (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Evidence</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Photos submitted with this completion.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {job.completion.evidence.map((ev) => (
              <a
                key={ev.id}
                href={`/api/evidence/${ev.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square overflow-hidden rounded-lg border border-zinc-700 transition hover:border-zinc-600"
              >
                <img
                  src={`/api/evidence/${ev.id}`}
                  alt="Evidence"
                  className="h-full w-full object-cover"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {(!job.completion || job.completion.evidence.length === 0) && (
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-sm text-zinc-500">
            No evidence submitted yet for this job.
          </p>
        </div>
      )}
    </div>
  );
}
