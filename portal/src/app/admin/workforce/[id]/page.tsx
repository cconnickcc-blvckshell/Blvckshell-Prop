import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function WorkforceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const account = await prisma.workforceAccount.findUnique({
    where: { id: params.id },
    include: {
      workers: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              phone: true,
            },
          },
        },
      },
      complianceDocuments: {
        orderBy: { uploadedAt: "desc" },
      },
      jobs: {
        take: 10,
        orderBy: { scheduledStart: "desc" },
        include: {
          site: { select: { name: true } },
        },
      },
    },
  });

  if (!account) {
    notFound();
  }

  const hasValidCOI = account.complianceDocuments.some(
    (d) => d.type === "COI" && (!d.expiresAt || new Date(d.expiresAt) > new Date())
  );
  const hasValidWSIB = account.complianceDocuments.some(
    (d) => d.type === "WSIB" && (!d.expiresAt || new Date(d.expiresAt) > new Date())
  );
  const complianceBlocked = !hasValidCOI || !hasValidWSIB;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{account.displayName}</h1>
        <p className="text-zinc-400">
          {account.type} • {account.workers.length} worker(s)
        </p>
      </div>

      {/* Compliance status */}
      <div
        className={`rounded-xl border p-4 ${
          complianceBlocked
            ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
        }`}
      >
        <h2 className="font-semibold">Compliance</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">
          <li>COI: {hasValidCOI ? "Valid" : "Missing or expired"}</li>
          <li>WSIB: {hasValidWSIB ? "Valid" : "Missing or expired"}</li>
        </ul>
        {complianceBlocked && (
          <p className="mt-2 text-sm opacity-90">
            New job assignment is blocked until compliance is updated. Admin override
            allowed with audit log.
          </p>
        )}
      </div>

      {/* Contact */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Contact</h2>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-zinc-500">Primary contact</dt>
            <dd className="font-medium text-white">{account.primaryContactName}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Email</dt>
            <dd className="text-white">{account.primaryContactEmail}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Phone</dt>
            <dd className="text-white">{account.primaryContactPhone}</dd>
          </div>
          {account.hstNumber && (
            <div>
              <dt className="text-zinc-500">HST</dt>
              <dd className="text-white">{account.hstNumber}</dd>
            </div>
          )}
          {account.wsibAccountNumber && (
            <div>
              <dt className="text-zinc-500">WSIB</dt>
              <dd className="text-white">{account.wsibAccountNumber}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Workers */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Workers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-zinc-400">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {account.workers.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-2 text-sm text-white">{w.user.name}</td>
                  <td className="px-4 py-2 text-sm text-zinc-400">{w.user.email}</td>
                  <td className="px-4 py-2 text-sm text-zinc-400">{w.user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {account.workers.length === 0 && (
          <p className="text-sm text-zinc-500">No workers in this account.</p>
        )}
      </div>

      {/* Recent jobs */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent Jobs</h2>
        <ul className="space-y-2">
          {account.jobs.map((job) => (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Link
                href={`/admin/jobs/${job.id}`}
                className="text-white hover:text-emerald-400"
              >
                {job.site.name} — {new Date(job.scheduledStart).toLocaleDateString()}
              </Link>
              <span className="rounded border border-zinc-600 bg-zinc-800/50 px-2 py-0.5 text-xs text-zinc-300">
                {job.status}
              </span>
            </li>
          ))}
        </ul>
        {account.jobs.length === 0 && (
          <p className="text-sm text-zinc-500">No jobs assigned.</p>
        )}
      </div>
    </div>
  );
}
