import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getQuote } from "@/server/actions/quote-actions";
import Link from "next/link";
import QuotePricingClient from "./QuotePricingClient";

export default async function QuotePricingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const latestSnapshot = quote.snapshots[0] ?? null;
  const expired = new Date() > quote.expiresAt;

  const baseMinutes = quote.areaLines.reduce(
    (sum, line) => sum + (line.overrideMinutes ?? line.computedMinutes),
    0
  );
  const totalMinutesPerVisit =
    baseMinutes + quote.travelMinutesPerVisit + quote.winterMinutesPerVisitDelta;
  const hasScope = quote.areaLines.length >= 1 && totalMinutesPerVisit > 0;

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href="/admin/quotes" className="text-sm text-zinc-400 hover:text-white">← Quotes</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
          Pricing: {quote.site.name}
        </h1>
        <p className="text-zinc-400">
          Margin gate • Founder overrides only with reason + AuditLog
        </p>
      </div>
      {!hasScope && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-4">
          <p className="font-medium text-amber-200">Scope required before pricing</p>
          <p className="mt-1 text-sm text-amber-200/90">
            Add at least one area line and ensure total minutes per visit &gt; 0 in the walkthrough.
          </p>
          <Link
            href={`/admin/quotes/${id}/walkthrough`}
            className="mt-3 inline-block text-sm font-medium text-amber-300 underline hover:text-amber-200"
          >
            Go to walkthrough →
          </Link>
        </div>
      )}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        {latestSnapshot && (
          <ul className="space-y-1 text-sm text-zinc-300">
            <li>Base gate: {latestSnapshot.passesBaseGate ? "✓" : "✗"}</li>
            <li>Stress gate: {latestSnapshot.passesStressGate ? "✓" : "✗"}</li>
            <li>Revenue floor: {latestSnapshot.passesRevenueFloor ? "✓" : "✗"}</li>
            <li>Expired: {expired ? "Yes" : "No"}</li>
          </ul>
        )}
        <QuotePricingClient
          quoteId={id}
          status={quote.status}
          hasSnapshot={!!latestSnapshot}
          expired={expired}
          hasScope={hasScope}
          gatesPassed={
            !!latestSnapshot &&
            latestSnapshot.passesBaseGate &&
            latestSnapshot.passesStressGate &&
            latestSnapshot.passesRevenueFloor
          }
        />
      </div>
      <div>
        <Link
          href={`/admin/quotes/${id}/proposal`}
          className="text-sm text-zinc-400 hover:text-white"
        >
          View proposal (PDF from snapshot)
        </Link>
      </div>
    </div>
  );
}
