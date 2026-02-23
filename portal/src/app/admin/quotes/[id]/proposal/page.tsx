import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getQuoteForProposal } from "@/server/actions/quote-actions";
import Link from "next/link";
import QuoteProposalClient from "./QuoteProposalClient";

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
        <p className="text-zinc-400">
          Official quote generated from QuoteSnapshot only (audit version). Use print to save as PDF.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-white p-6 text-black print:border-0 print:p-0">
        <div className="mb-4 flex justify-between text-sm">
          <div>
            <p className="font-semibold">Client</p>
            <p>{quote.site.clientOrganization.name}</p>
            <p className="text-zinc-600">{quote.site.clientOrganization.primaryContactEmail}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Site</p>
            <p>{quote.site.name}</p>
            <p className="text-zinc-600">{quote.site.address}</p>
          </div>
        </div>
        <div className="mb-4 border-t border-zinc-200 pt-3 text-sm">
          <p>
            Snapshot v{snapshot.snapshotVersion} • Monthly amount:{" "}
            <span className="font-semibold">
              ${(snapshot.riskAdjustedRevenueCents / 100).toFixed(2)}/mo
            </span>{" "}
            • Margin {snapshot.grossMarginBps / 100}%.
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            Based on {snapshot.minutesPerVisitTotal} minutes/visit, {quote.visitsPerWeek} visits/week, including travel and
            winter adjustments, and current pricing policy.
          </p>
        </div>
        <div className="mt-4 text-xs text-zinc-500 print:text-black">
          <p>
            This quote is generated from a frozen snapshot of scope, presets, and pricing policy at the time of approval. Any
            subsequent changes require a new quote.
          </p>
        </div>
      </div>
      <QuoteProposalClient quoteId={id} status={quote.status} hasSnapshot={!!snapshot} />
    </div>
  );
}
