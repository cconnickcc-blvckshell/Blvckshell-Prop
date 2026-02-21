import Link from "next/link";
import { requireClient } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function ClientInvoicesPage() {
  const user = await requireClient();

  const invoices = await prisma.invoice.findMany({
    where: { clientId: user.clientOrganizationId! },
    orderBy: { periodStart: "desc" },
    take: 100,
    select: {
      id: true,
      invoiceNumber: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      totalCents: true,
    },
  });

  const statusLabel: Record<string, string> = {
    Draft: "Draft",
    Sent: "Sent",
    Paid: "Paid",
    Void: "Void",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Invoices
      </h1>
      <p className="mt-1 text-zinc-400">
        View and download invoices for your organization.
      </p>
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No invoices yet.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Period
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  View
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-800/30">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-300">
                    {inv.periodStart.toLocaleDateString()} –{" "}
                    {inv.periodEnd.toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300">
                    {statusLabel[inv.status] ?? inv.status}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-zinc-300">
                    ${(inv.totalCents / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/client/invoices/${inv.id}`}
                      className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
