import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import BulkResolveIncidentsPanel from "@/components/admin/BulkResolveIncidentsPanel";
import { formatDateTime, formatIncidentType } from "@/lib/format";

export const metadata = { title: "Incidents" };

export default async function IncidentsPage() {
  await requireAdmin();

  const incidents = await prisma.incidentReport.findMany({
    include: {
      site: { select: { name: true } },
      worker: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { reportedAt: "desc" },
    take: 50,
  });
  const incidentItems = incidents.map((incident) => ({
    id: incident.id,
    resolvedAt: incident.resolvedAt ? incident.resolvedAt.toISOString() : null,
    siteName: incident.site.name,
    typeLabel: formatIncidentType(incident.type),
    reportedAtLabel: formatDateTime(incident.reportedAt),
  }));

  const typeColor: Record<string, string> = {
    SAFETY: "bg-red-500/20 text-red-300 border-red-500/40",
    PROPERTY_DAMAGE: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    BIOHAZARD: "bg-red-500/20 text-red-300 border-red-500/40",
    LOST_KEY: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    OTHER: "bg-zinc-600/30 text-zinc-300 border-zinc-500/40",
  };

  return (
    <div className="w-full">
      <BulkResolveIncidentsPanel incidents={incidentItems} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Incidents</h1>
        <p className="mt-1 text-zinc-400">Safety, property damage, and other reports</p>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <ul className="space-y-3 p-3 lg:hidden" data-record-list>
          {incidents.map((inc) => (
            <li key={inc.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-white">{inc.site.name}</p>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${typeColor[inc.type] ?? "bg-zinc-600/30 text-zinc-300 border-zinc-500/40"}`}>
                  {inc.type.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-1 text-sm text-zinc-400">{formatDateTime(inc.reportedAt)} · {inc.worker.user.name}</p>
              <p className="mt-2 text-sm text-zinc-300">{inc.description}</p>
              <p className="mt-2 text-xs text-zinc-500">{inc.resolvedAt ? `Resolved ${formatDateTime(inc.resolvedAt)}` : "Open"}</p>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Site
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Reported by
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Resolved
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-300 sm:px-6">
                    {formatDateTime(inc.reportedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-white sm:px-6">
                    {inc.site.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        typeColor[inc.type] ?? "bg-zinc-600/30 text-zinc-300 border-zinc-500/40"
                      }`}
                    >
                      {inc.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-300 sm:px-6">
                    {inc.worker.user.name}
                  </td>
                  <td className="max-w-xs truncate px-4 py-4 text-sm text-zinc-300 sm:px-6">
                    {inc.description}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-400 sm:px-6">
                    {inc.resolvedAt ? formatDateTime(inc.resolvedAt) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {incidents.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No incidents reported yet. Incidents appear when workers report safety, property damage, lost key, or other issues.
            <br />
            <span className="mt-2 inline-block text-zinc-400">Review jobs and evidence from the Jobs page.</span>
          </div>
        )}
      </section>
    </div>
  );
}
