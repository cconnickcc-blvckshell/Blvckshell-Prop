import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatRole, formatJobStatus, formatClassification, formatPaymentRail, formatDate, formatCalendarDate } from "@/lib/format";
import WorkforceAccountControls from "@/components/admin/WorkforceAccountControls";
import ComplianceDocumentForm from "@/components/admin/ComplianceDocumentForm";

export const metadata = { title: "Workforce account" };

function plural(count: number, singular: string, pluralLabel = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralLabel}`;
}

export default async function WorkforceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const account = await prisma.workforceAccount.findUnique({
    where: { id: params.id },
    include: {
      users: {
        where: { isActive: true },
        select: { id: true, name: true, email: true, role: true, phone: true },
        orderBy: { name: "asc" },
      },
      workers: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, phone: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      complianceDocuments: {
        orderBy: { uploadedAt: "desc" },
      },
    },
  });

  if (!account) {
    notFound();
  }

  const recentJobs = await prisma.job.findMany({
    where: { assignedWorker: { workforceAccountId: account.id } },
    take: 10,
    orderBy: { scheduledStart: "desc" },
    include: { site: { select: { name: true } } },
  });

  const now = new Date();
  const hasValidCOI = account.complianceDocuments.some(
    (doc) => doc.type === "COI" && (!doc.expiresAt || doc.expiresAt > now),
  );
  const hasValidWSIB = account.complianceDocuments.some(
    (doc) => doc.type === "WSIB" && (!doc.expiresAt || doc.expiresAt > now),
  );
  const complianceBlocked = account.type === "VENDOR" && (!hasValidCOI || !hasValidWSIB);
  const activeWorkers = account.workers.filter((worker) => worker.isActive);
  const workerUserIds = new Set(account.workers.map((worker) => worker.user.id));
  const ownersWithoutWorker = account.users.filter(
    (accountUser) => accountUser.role === "VENDOR_OWNER" && !workerUserIds.has(accountUser.id),
  );

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{account.displayName}</h1>
        <p className="text-zinc-400">
          {account.type} • {formatClassification(account.classification)} • {plural(activeWorkers.length, "worker")}
          {ownersWithoutWorker.length > 0 && ` • ${plural(ownersWithoutWorker.length, "owner")}`}
          {account.complianceSuspended && (
            <span className="ml-2 inline-flex rounded-full border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
              Compliance suspended
            </span>
          )}
        </p>
      </div>

      {account.type === "VENDOR" ? (
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
          {complianceBlocked ? (
            <p className="mt-2 text-sm opacity-90">
              New job assignment is blocked until COI and WSIB are on file and unexpired. An admin can
              override with a reason, which is written to the audit log.
            </p>
          ) : (
            <p className="mt-2 text-sm opacity-90">COI and WSIB are current. New jobs can be assigned.</p>
          )}
          <ul className="mt-3 space-y-1 text-sm text-zinc-200">
            {account.complianceDocuments.map((doc) => (
              <li key={doc.id}>
                {doc.type} · uploaded {formatDate(doc.uploadedAt)} ·{" "}
                {doc.expiresAt ? `expires ${formatCalendarDate(doc.expiresAt)}` : "no expiry date"}
              </li>
            ))}
          </ul>
          <ComplianceDocumentForm accountId={account.id} />
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-300">
          Internal employees are paid through payroll. COI and WSIB are required for subcontractor accounts, not this one.
        </div>
      )}

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
              <dt className="text-zinc-500">WSIB account</dt>
              <dd className="text-white">{account.wsibAccountNumber}</dd>
            </div>
          )}
        </dl>
        <div className="mt-6 border-t border-zinc-800 pt-4">
          <WorkforceAccountControls
            accountId={account.id}
            classification={account.classification}
            allowedPaymentMethod={account.allowedPaymentMethod}
            users={account.users.map((accountUser) => ({
              id: accountUser.id,
              name: accountUser.name,
              email: accountUser.email,
              role: accountUser.role,
            }))}
          />
        </div>
      </div>

      {ownersWithoutWorker.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Owner</h2>
          <p className="mb-3 text-sm text-zinc-500">Signs in to the vendor portal. Not counted as a cleaner.</p>
          <ul className="space-y-2 text-sm">
            {ownersWithoutWorker.map((owner) => (
              <li key={owner.id} className="text-white">
                {owner.name} <span className="text-zinc-500">{owner.email}</span>
                <span className="ml-2 text-xs text-zinc-400">{formatRole(owner.role)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
              {activeWorkers.map((worker) => (
                <tr key={worker.id}>
                  <td className="px-4 py-2 text-sm text-white">{worker.user.name}</td>
                  <td className="px-4 py-2 text-sm text-zinc-400">{worker.user.email}</td>
                  <td className="px-4 py-2 text-sm text-zinc-400">{formatRole(worker.user.role)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {activeWorkers.length === 0 && (
          <p className="text-sm text-zinc-500">No cleaners in this account yet.</p>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent jobs</h2>
        <ul className="space-y-2">
          {recentJobs.map((job) => (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <Link href={`/admin/jobs/${job.id}`} className="text-white hover:text-emerald-400">
                {job.site.name} — {formatDate(job.scheduledStart)}
              </Link>
              <span className="rounded border border-zinc-600 bg-zinc-800/50 px-2 py-0.5 text-xs text-zinc-300">
                {formatJobStatus(job.status)}
              </span>
            </li>
          ))}
        </ul>
        {recentJobs.length === 0 && <p className="text-sm text-zinc-500">No jobs assigned to workers on this account.</p>}
      </div>
    </div>
  );
}
