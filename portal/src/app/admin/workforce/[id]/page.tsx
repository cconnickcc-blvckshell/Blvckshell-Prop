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
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{account.displayName}</h1>
          <p className="text-gray-600">
            {account.type} • {account.workers.length} worker(s)
          </p>
        </div>
      </div>

      {/* Compliance status */}
      <div
        className={`rounded-lg p-4 ${
          complianceBlocked ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"
        }`}
      >
        <h2 className="font-semibold">Compliance</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">
          <li>COI: {hasValidCOI ? "Valid" : "Missing or expired"}</li>
          <li>WSIB: {hasValidWSIB ? "Valid" : "Missing or expired"}</li>
        </ul>
        {complianceBlocked && (
          <p className="mt-2 text-sm">
            New job assignment is blocked until compliance is updated. Admin override
            allowed with audit log.
          </p>
        )}
      </div>

      {/* Contact */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact</h2>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-gray-500">Primary contact</dt>
            <dd className="font-medium text-gray-900">{account.primaryContactName}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Email</dt>
            <dd className="text-gray-900">{account.primaryContactEmail}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Phone</dt>
            <dd className="text-gray-900">{account.primaryContactPhone}</dd>
          </div>
          {account.hstNumber && (
            <div>
              <dt className="text-gray-500">HST</dt>
              <dd className="text-gray-900">{account.hstNumber}</dd>
            </div>
          )}
          {account.wsibAccountNumber && (
            <div>
              <dt className="text-gray-500">WSIB</dt>
              <dd className="text-gray-900">{account.wsibAccountNumber}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Workers */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Workers</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Email
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">
                  Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {account.workers.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    {w.user.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">{w.user.email}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{w.user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {account.workers.length === 0 && (
          <p className="text-sm text-gray-500">No workers in this account.</p>
        )}
      </div>

      {/* Recent jobs */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Jobs</h2>
        <ul className="space-y-2">
          {account.jobs.map((job) => (
            <li key={job.id} className="flex items-center justify-between text-sm">
              <Link
                href={`/admin/jobs/${job.id}`}
                className="text-gray-900 hover:underline"
              >
                {job.site.name} — {new Date(job.scheduledStart).toLocaleDateString()}
              </Link>
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {job.status}
              </span>
            </li>
          ))}
        </ul>
        {account.jobs.length === 0 && (
          <p className="text-sm text-gray-500">No jobs assigned.</p>
        )}
      </div>
    </div>
  );
}
