import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import BulkGenerateDraftsPanel from "@/components/admin/BulkGenerateDraftsPanel";
import FilterBar from "@/components/admin/FilterBar";
import ExportCSVButton from "@/components/admin/ExportCSVButton";
import type { InvoiceStatus } from "@prisma/client";

export default async function AdminInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; clientId?: string; q?: string; from?: string; to?: string }>;
}) {
  await requireAdmin();

  const { status, clientId, q, from, to } = await searchParams;

  const [invoices, clients] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        ...(status ? { status: status as InvoiceStatus } : {}),
        ...(clientId ? { clientId } : {}),
        ...(q ? { client: { name: { contains: q, mode: "insensitive" as const } } } : {}),
        ...(from || to ? {
          periodStart: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
          },
        } : {}),
      },
      select: {
        id: true,
        clientId: true,
        invoiceNumber: true,
        periodStart: true,
        periodEnd: true,
        status: true,
        issuedAt: true,
        dueAt: true,
        notes: true,
        subtotalCents: true,
        taxCents: true,
        totalCents: true,
        createdById: true,
        createdAt: true,
        updatedAt: true,
        client: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.clientOrganization.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const statusClass: Record<string, string> = {
    Draft: "bg-zinc-600/30 text-zinc-300 border-zinc-500/40",
    Sent: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    Paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    Void: "bg-red-500/20 text-red-300 border-red-500/40",
  };

  return (
    <div className="w-full">
      <BulkGenerateDraftsPanel clients={clients} />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Invoices</h1>
          <p className="mt-1 text-zinc-400">Create and manage client invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCSVButton endpoint="/api/admin/export/invoices" filename={`invoices-${new Date().toISOString().split("T")[0]}.csv`} />
          <Link
            href="/admin/invoices/new"
            prefetch={false}
            className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            New draft invoice
          </Link>
        </div>
      </div>

      <FilterBar
        filters={[
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { value: "Draft", label: "Draft" },
              { value: "Sent", label: "Sent" },
              { value: "Paid", label: "Paid" },
            ],
          },
          {
            key: "clientId",
            label: "Client",
            type: "select",
            options: clients.map((c) => ({ value: c.id, label: c.name })),
          },
          { key: "from", label: "From", type: "date" },
          { key: "to", label: "To", type: "date" },
        ]}
      />

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-white">
                    <Link href={`/admin/invoices/${inv.id}`} prefetch={false} className="hover:text-emerald-400">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {inv.client.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {new Date(inv.periodStart).toLocaleDateString()} –{" "}
                    {new Date(inv.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        statusClass[inv.status] ?? "bg-zinc-600/30 text-zinc-300"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-zinc-300">
                    ${(inv.totalCents / 100).toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      href={`/admin/invoices/${inv.id}`}
                      prefetch={false}
                      className="font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {invoices.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-zinc-500 mb-4">
              No invoices yet.
            </p>
            <Link
              href="/admin/invoices/new"
              prefetch={false}
              className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
            >
              Create your first invoice
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
