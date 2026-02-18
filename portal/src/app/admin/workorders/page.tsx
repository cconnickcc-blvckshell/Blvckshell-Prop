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
    REQUESTED: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
    APPROVED: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    ASSIGNED: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    COMPLETED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    INVOICED: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    PAID: "bg-zinc-600/30 text-zinc-300 border-zinc-500/40",
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Work Orders</h1>
        <p className="mt-1 text-zinc-400">Add-ons and change orders</p>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Site
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Assigned
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400 sm:px-6">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {workOrders.map((wo) => (
                <tr key={wo.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-white sm:px-6">
                    {wo.site.name}
                  </td>
                  <td className="max-w-xs truncate px-4 py-4 text-sm text-zinc-300 sm:px-6">
                    {wo.description}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        statusColor[wo.status] ?? "bg-zinc-600/30 text-zinc-300 border-zinc-500/40"
                      }`}
                    >
                      {wo.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-300 sm:px-6">
                    {wo.assignedWorkforceAccount?.displayName ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-zinc-300 sm:px-6">
                    ${(wo.priceCents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {workOrders.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">No work orders yet.</div>
        )}
      </section>
    </div>
  );
}
