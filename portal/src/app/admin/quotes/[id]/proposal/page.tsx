import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getQuoteForProposal } from "@/server/actions/quote-actions";
import Link from "next/link";

export default async function QuoteProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const quote = await getQuoteForProposal(id);
  if (!quote) notFound();

  const snapshot = quote.snapshots[0];
  if (!snapshot) {
    return (
      <div className="w-full space-y-6">
        <Link href={`/admin/quotes/${id}/pricing`} className="text-sm text-zinc-400 hover:text-white">← Pricing</Link>
        <p className="text-amber-400">No snapshot yet. Compute snapshot on the pricing page first.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href={`/admin/quotes/${id}/pricing`} className="text-sm text-zinc-400 hover:text-white">← Pricing</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
          Proposal: {quote.site.name}
        </h1>
        <p className="text-zinc-400">Proposal PDF generated from QuoteSnapshot only (audit version).</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-zinc-300">
          Snapshot v{snapshot.snapshotVersion} • ${(snapshot.riskAdjustedRevenueCents / 100).toFixed(2)}/mo risk-adjusted •
          Margin {snapshot.grossMarginBps / 100}%
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          PDF generation from snapshot data can be wired here (e.g. react-pdf or server-side PDF).
        </p>
      </div>
    </div>
  );
}
