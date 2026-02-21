import { notFound } from "next/navigation";
import Link from "next/link";
import { requireClient } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function ClientInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireClient();
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, clientId: user.clientOrganizationId! },
    select: {
      id: true,
      invoiceNumber: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      subtotalCents: true,
      taxCents: true,
      totalCents: true,
      client: { select: { name: true } },
      lineItems: {
        select: {
          id: true,
          description: true,
          qty: true,
          amountCents: true,
          site: { select: { name: true } },
        },
      },
      adjustments: {
        where: { status: { in: ["Approved", "Applied"] } },
        select: { id: true, type: true, amountCents: true, notes: true, reasonCode: true },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const statusLabel: Record<string, string> = {
    Draft: "Draft",
    Sent: "Sent",
    Paid: "Paid",
    Void: "Void",
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/client/invoices"
          className="text-sm font-medium text-zinc-400 hover:text-zinc-200"
        >
          ← Invoices
        </Link>
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Invoice #{invoice.invoiceNumber}
      </h1>
      <p className="mt-1 text-zinc-400">
        {invoice.client.name} • Period:{" "}
        {invoice.periodStart.toLocaleDateString()} –{" "}
        {invoice.periodEnd.toLocaleDateString()} •{" "}
        {statusLabel[invoice.status] ?? invoice.status}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <a
          href={`/api/invoices/${invoice.id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Download PDF
        </a>
      </div>

      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-lg font-semibold text-white">Line items</h2>
        <ul className="mt-4 space-y-3">
          {invoice.lineItems.map((line) => (
            <li
              key={line.id}
              className="flex justify-between border-b border-zinc-800 pb-2 text-sm last:border-0"
            >
              <span className="text-zinc-300">
                {line.description}
                {line.site && (
                  <span className="ml-2 text-zinc-500">({line.site.name})</span>
                )}
              </span>
              <span className="text-white">
                ${(line.amountCents / 100).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        {invoice.adjustments.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-medium text-zinc-400">
              Adjustments
            </h3>
            <ul className="mt-2 space-y-2">
              {invoice.adjustments.map((adj) => (
                <li
                  key={adj.id}
                  className="flex justify-between text-sm text-zinc-300"
                >
                  <span>
                    {adj.type}: {adj.notes || adj.reasonCode || ""}
                  </span>
                  <span>
                    {adj.type === "Charge"
                      ? "+"
                      : "-"}
                    ${(Math.abs(adj.amountCents) / 100).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-6 border-t border-zinc-700 pt-4">
          <div className="flex justify-between text-sm text-zinc-400">
            <span>Subtotal</span>
            <span>${(invoice.subtotalCents / 100).toFixed(2)}</span>
          </div>
          {invoice.taxCents > 0 && (
            <div className="mt-1 flex justify-between text-sm text-zinc-400">
              <span>HST (13%)</span>
              <span>${(invoice.taxCents / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between font-semibold text-white">
            <span>Total</span>
            <span>${(invoice.totalCents / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
