import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PayoutBatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const batch = await prisma.payoutBatch.findUnique({
    where: { id },
    include: {
      payoutLines: {
        include: {
          workforceAccount: { select: { id: true, displayName: true } },
        },
        orderBy: [{ workforceAccountId: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!batch) notFound();

  const byWorker = batch.payoutLines.reduce<
    Map<string, { name: string; lines: typeof batch.payoutLines; totalCents: number }>
  >((acc, line) => {
    const wid = line.workforceAccountId;
    const name = line.workforceAccount.displayName;
    if (!acc.has(wid)) acc.set(wid, { name, lines: [], totalCents: 0 });
    const entry = acc.get(wid)!;
    entry.lines.push(line);
    entry.totalCents += line.amountCents;
    return acc;
  }, new Map());

  const statusColor: Record<string, string> = {
    CALCULATED: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    APPROVED: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    RELEASED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    PAID: "bg-zinc-600/30 text-zinc-300 border-zinc-500/40",
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href="/admin/payouts" className="text-sm text-zinc-400 hover:text-white">
          ← Payouts
        </Link>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Payout batch</h1>
            <p className="text-zinc-400">
              {new Date(batch.periodStart).toLocaleDateString()} –{" "}
              {new Date(batch.periodEnd).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`inline-flex shrink-0 rounded-full border px-3 py-1 text-sm font-semibold ${
              statusColor[batch.status] ?? "bg-zinc-600/30 text-zinc-300"
            }`}
          >
            {batch.status}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Pay statements</h2>
        <p className="mb-4 text-sm text-zinc-500">
          Download a PDF statement for each worker in this batch.
        </p>
        <ul className="space-y-4">
          {Array.from(byWorker.entries()).map(([workforceAccountId, { name, lines, totalCents }]) => (
            <li
              key={workforceAccountId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-700 bg-zinc-800/30 px-4 py-3"
            >
              <div>
                <p className="font-medium text-white">{name}</p>
                <p className="text-xs text-zinc-500">
                  {lines.length} job(s) • ${(totalCents / 100).toFixed(2)}
                </p>
              </div>
              <a
                href={`/api/payouts/batch/${batch.id}/statement?workforceAccountId=${encodeURIComponent(workforceAccountId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                Download PDF
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Line items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800">
            <thead>
              <tr>
                <th className="pb-2 text-left text-xs font-medium uppercase text-zinc-400">
                  Worker
                </th>
                <th className="pb-2 text-left text-xs font-medium uppercase text-zinc-400">
                  Description
                </th>
                <th className="pb-2 text-right text-xs font-medium uppercase text-zinc-400">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {batch.payoutLines.map((line) => (
                <tr key={line.id}>
                  <td className="py-2 text-sm text-zinc-300">
                    {line.workforceAccount.displayName}
                  </td>
                  <td className="py-2 text-sm text-zinc-300">
                    {line.description ?? `Job ${line.jobId ?? "—"}`}
                  </td>
                  <td className="py-2 text-right text-sm font-medium text-zinc-200">
                    ${(line.amountCents / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
