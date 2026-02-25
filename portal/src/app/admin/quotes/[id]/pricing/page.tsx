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

  const s = latestSnapshot;

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href="/admin/quotes" prefetch={false} className="text-sm text-zinc-400 hover:text-white">← Quotes</Link>
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
            prefetch={false}
            className="mt-3 inline-block text-sm font-medium text-amber-300 underline hover:text-amber-200"
          >
            Go to walkthrough →
          </Link>
        </div>
      )}

      {s && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Revenue */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Revenue</h3>
            <p className="text-3xl font-bold text-white">
              ${(s.riskAdjustedRevenueCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-sm font-normal text-zinc-500"> /mo</span>
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Base: ${(s.baseRevenueCents / 100).toFixed(2)}/mo
            </p>
            <div className="mt-3 space-y-1 text-xs text-zinc-500">
              <p>Billing rate: ${(s.billingRateCentsPerHour / 100).toFixed(2)}/hr</p>
              <p>Monthly hours: {Number(s.monthlyHours).toFixed(1)} hrs</p>
              <p>Hours/visit: {Number(s.hoursPerVisit).toFixed(2)}</p>
              <p>Risk multiplier: {(s.riskMultiplierBps / 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Time breakdown */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Time Breakdown</h3>
            <div className="space-y-2 text-sm text-zinc-300">
              <div className="flex justify-between">
                <span>Base (areas)</span>
                <span className="font-medium text-white">{s.minutesPerVisitBase} min</span>
              </div>
              <div className="flex justify-between">
                <span>Travel</span>
                <span className="font-medium text-white">{s.minutesPerVisitTravel} min</span>
              </div>
              <div className="flex justify-between">
                <span>Winter delta</span>
                <span className="font-medium text-white">{s.minutesPerVisitWinterDelta} min</span>
              </div>
              <div className="flex justify-between border-t border-zinc-700 pt-2">
                <span className="font-semibold text-white">Total per visit</span>
                <span className="font-bold text-white">{s.minutesPerVisitTotal} min</span>
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Costs</h3>
            <div className="space-y-2 text-sm text-zinc-300">
              <div className="flex justify-between">
                <span>Supplies</span>
                <span className="font-medium text-white">${(s.monthlySupplyCostCents / 100).toFixed(2)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span>Max labor (target)</span>
                <span className="font-medium text-white">${(s.allowedPayoutCentsPerHourAtTarget / 100).toFixed(2)}/hr</span>
              </div>
              <div className="flex justify-between">
                <span>Max labor (stress)</span>
                <span className="font-medium text-white">${(s.allowedPayoutCentsPerHourAtStress / 100).toFixed(2)}/hr</span>
              </div>
            </div>
          </div>

          {/* Margins */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Margins</h3>
            <p className="text-2xl font-bold text-white">${(s.grossProfitCents / 100).toFixed(2)}<span className="text-sm font-normal text-zinc-500"> gross profit/mo</span></p>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Gross margin</span>
                <span className={`font-semibold ${s.passesBaseGate ? "text-emerald-400" : "text-red-400"}`}>
                  {(s.grossMarginBps / 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${s.passesBaseGate ? "bg-emerald-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(Math.max(s.grossMarginBps / 100, 0), 100)}%` }}
                />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Stress margin</span>
                <span className={`font-semibold ${s.passesStressGate ? "text-emerald-400" : "text-red-400"}`}>
                  {(s.stressGrossMarginBps / 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-1 h-3 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${s.passesStressGate ? "bg-emerald-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(Math.max(s.stressGrossMarginBps / 100, 0), 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Gates */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Gates</h3>
            <div className="space-y-3">
              {[
                { label: "Base margin gate", pass: s.passesBaseGate, detail: `${(s.grossMarginBps / 100).toFixed(1)}% gross margin` },
                { label: "Stress margin gate", pass: s.passesStressGate, detail: `${(s.stressGrossMarginBps / 100).toFixed(1)}% under stress` },
                { label: "Revenue floor", pass: s.passesRevenueFloor, detail: `$${(s.riskAdjustedRevenueCents / 100).toFixed(0)}/mo revenue` },
              ].map((gate) => (
                <div key={gate.label} className="flex items-center gap-3">
                  <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${gate.pass ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                    {gate.pass ? "✓" : "✗"}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{gate.label}</p>
                    <p className="text-xs text-zinc-500">{gate.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            {expired && (
              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <p className="text-xs font-medium text-amber-300">Quote expired</p>
              </div>
            )}
          </div>

          {/* Confidence */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Confidence</h3>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-white">{s.confidenceScore}</p>
              <span className={`mb-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                s.confidenceBand === "HIGH" ? "bg-emerald-500/20 text-emerald-400" :
                s.confidenceBand === "MEDIUM" ? "bg-amber-500/20 text-amber-400" :
                "bg-red-500/20 text-red-400"
              }`}>
                {s.confidenceBand}
              </span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all ${
                  s.confidenceBand === "HIGH" ? "bg-emerald-500" :
                  s.confidenceBand === "MEDIUM" ? "bg-amber-500" :
                  "bg-red-500"
                }`}
                style={{ width: `${Math.min(s.confidenceScore, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Snapshot v{s.snapshotVersion} · {s.pricingPolicyCityCode} policy
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
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
          prefetch={false}
          className="text-sm text-zinc-400 hover:text-white"
        >
          View proposal (PDF from snapshot)
        </Link>
      </div>
    </div>
  );
}
