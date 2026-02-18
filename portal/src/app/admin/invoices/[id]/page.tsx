import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getInvoiceWithDetails, getUninvoicedApprovedJobs } from "@/server/actions/invoice-actions";
import Link from "next/link";
import InvoiceDraftActions from "./InvoiceDraftActions";
import InvoiceStatusActions from "./InvoiceStatusActions";
import AddContractBaseButton from "./AddContractBaseButton";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const invoice = await getInvoiceWithDetails(id);
  if (!invoice) notFound();

  const uninvoicedJobs =
    invoice.status === "Draft"
      ? await getUninvoicedApprovedJobs(
          invoice.clientId,
          invoice.periodStart,
          invoice.periodEnd
        )
      : [];

  const statusClass: Record<string, string> = {
    Draft: "bg-zinc-600/30 text-zinc-300 border-zinc-500/40",
    Sent: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    Paid: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    Void: "bg-red-500/20 text-red-300 border-red-500/40",
  };

  const jobIdsOnInvoice = new Set(invoice.lineItems.filter((l) => l.jobId).map((l) => l.jobId!));

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href="/admin/invoices" className="text-sm text-zinc-400 hover:text-white">
          ← Invoices
        </Link>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {invoice.invoiceNumber}
            </h1>
            <p className="text-zinc-400">{invoice.client.name}</p>
            <p className="mt-1 text-sm text-zinc-500">
              Period: {new Date(invoice.periodStart).toLocaleDateString()} –{" "}
              {new Date(invoice.periodEnd).toLocaleDateString()}
              {invoice.dueAt && (
                <> • Due: {new Date(invoice.dueAt).toLocaleDateString()}</>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
                statusClass[invoice.status] ?? "bg-zinc-600/30 text-zinc-300"
              }`}
            >
              {invoice.status}
            </span>
            <a
              href={`/api/invoices/${invoice.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Download PDF
            </a>
            <InvoiceStatusActions invoiceId={invoice.id} status={invoice.status} />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-white">Line items</h2>
          {invoice.status === "Draft" && (
            <AddContractBaseButton invoiceId={invoice.id} />
          )}
        </div>
        {invoice.lineItems.length === 0 ? (
          <p className="text-sm text-zinc-500">No line items yet. Add jobs below or add monthly base from contracts.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800">
              <thead>
                <tr>
                  <th className="pb-2 text-left text-xs font-medium uppercase text-zinc-400">
                    Description
                  </th>
                  <th className="pb-2 text-right text-xs font-medium uppercase text-zinc-400">
                    Qty
                  </th>
                  <th className="pb-2 text-right text-xs font-medium uppercase text-zinc-400">
                    Unit price
                  </th>
                  <th className="pb-2 text-right text-xs font-medium uppercase text-zinc-400">
                    Amount
                  </th>
                  {invoice.status === "Draft" && (
                    <th className="pb-2 text-right text-xs font-medium uppercase text-zinc-400">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {invoice.lineItems.map((line) => (
                  <tr key={line.id}>
                    <td className="py-2 text-sm text-zinc-300">{line.description}</td>
                    <td className="py-2 text-right text-sm text-zinc-300">{line.qty}</td>
                    <td className="py-2 text-right text-sm text-zinc-300">
                      ${(line.unitPriceCents / 100).toFixed(2)}
                    </td>
                    <td className="py-2 text-right text-sm font-medium text-zinc-200">
                      ${(line.amountCents / 100).toFixed(2)}
                    </td>
                    {invoice.status === "Draft" && line.jobId && (
                      <td className="py-2 text-right">
                        <InvoiceDraftActions
                          invoiceId={invoice.id}
                          jobId={line.jobId}
                          action="remove"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Uninvoiced jobs (Draft only) */}
      {invoice.status === "Draft" && uninvoicedJobs.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Add approved jobs</h2>
          <ul className="space-y-2">
            {uninvoicedJobs.map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">{job.site.name}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(job.scheduledStart).toLocaleString()}
                    {job.completion?.completedAt &&
                      ` • Completed ${new Date(job.completion.completedAt).toLocaleDateString()}`}
                  </p>
                </div>
                {jobIdsOnInvoice.has(job.id) ? (
                  <span className="text-sm text-zinc-500">On invoice</span>
                ) : (
                  <InvoiceDraftActions invoiceId={invoice.id} jobId={job.id} action="add" />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Adjustments */}
      {invoice.adjustments.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Adjustments</h2>
          <ul className="space-y-2">
            {invoice.adjustments.map((a) => (
              <li
                key={a.id}
                className="flex justify-between gap-2 text-sm text-zinc-300"
              >
                <span>
                  {a.type}: {a.notes || a.reasonCode || a.id}
                </span>
                <span className={a.type === "Charge" ? "text-amber-300" : "text-emerald-400"}>
                  {a.type === "Charge" ? "+" : "-"}${(a.amountCents / 100).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add adjustment (Draft only) */}
      {invoice.status === "Draft" && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Add adjustment</h2>
          <InvoiceDraftActions invoiceId={invoice.id} action="adjustment" />
        </div>
      )}

      {/* Totals */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <div className="flex flex-col items-end gap-1 text-sm">
          <div className="flex w-48 justify-between text-zinc-400">
            <span>Subtotal</span>
            <span>${(invoice.subtotalCents / 100).toFixed(2)}</span>
          </div>
          {invoice.taxCents > 0 && (
            <div className="flex w-48 justify-between text-zinc-400">
              <span>Tax</span>
              <span>${(invoice.taxCents / 100).toFixed(2)}</span>
            </div>
          )}
          <div className="mt-2 flex w-48 justify-between border-t border-zinc-700 pt-2 text-base font-semibold text-white">
            <span>Total</span>
            <span>${(invoice.totalCents / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Created by {invoice.createdBy.name} on{" "}
        {new Date(invoice.createdAt).toLocaleString()}
      </p>
    </div>
  );
}
