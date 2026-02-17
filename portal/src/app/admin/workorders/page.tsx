import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function WorkOrdersPage() {
  await requireAdmin();

  const workOrders = await prisma.workOrder.findMany({
    include: {
      site: { select: { name: true } },
      assignedWorkforceAccount: { select: { displayName: true } },
    },
    orderBy: { id: "desc" },
    take: 50,
  });

  const statusColor: Record<string, string> = {
    REQUESTED: "bg-gray-100 text-gray-800",
    APPROVED: "bg-blue-100 text-blue-800",
    ASSIGNED: "bg-amber-100 text-amber-800",
    COMPLETED: "bg-green-100 text-green-800",
    INVOICED: "bg-purple-100 text-purple-800",
    PAID: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        <p className="text-gray-600">Add-ons and change orders</p>
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Assigned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {workOrders.map((wo) => (
                <tr key={wo.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {wo.site.name}
                  </td>
                  <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-600">
                    {wo.description}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        statusColor[wo.status] ?? "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {wo.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    {wo.assignedWorkforceAccount?.displayName ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                    ${(wo.priceCents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {workOrders.length === 0 && (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-gray-500">No work orders yet.</p>
        </div>
      )}
    </div>
  );
}
