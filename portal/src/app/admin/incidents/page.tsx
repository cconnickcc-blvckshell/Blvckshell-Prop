import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

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

  const typeColor: Record<string, string> = {
    SAFETY: "bg-red-100 text-red-800",
    PROPERTY_DAMAGE: "bg-amber-100 text-amber-800",
    BIOHAZARD: "bg-red-100 text-red-800",
    LOST_KEY: "bg-orange-100 text-orange-800",
    OTHER: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Incidents</h1>
        <p className="text-gray-600">Safety, property damage, and other reports</p>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Reported by
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Resolved
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {incidents.map((inc) => (
                <tr key={inc.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {new Date(inc.reportedAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {inc.site.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        typeColor[inc.type] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {inc.type.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {inc.worker.user.name}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-600">
                    {inc.description}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {inc.resolvedAt
                      ? new Date(inc.resolvedAt).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {incidents.length === 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">No incidents reported yet.</p>
        </div>
      )}
    </div>
  );
}
