import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getQuote } from "@/server/actions/quote-actions";
import { getActiveRateCard } from "@/server/actions/rate-card-actions";
import Link from "next/link";
import WalkthroughScopeClient from "./WalkthroughScopeClient";

export default async function QuoteWalkthroughPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [quote, rateCard] = await Promise.all([getQuote(id), getActiveRateCard()]);
  if (!quote) notFound();

  const rateCardEntries = (rateCard?.entries ?? []).map((e) => ({
    areaType: e.areaType,
    size: e.size,
    sizeLabel: e.sizeLabel,
    finish: e.finish,
    finishLabel: e.finishLabel,
    minutes: e.minutes,
    description: e.description,
  }));

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href="/admin/quotes" prefetch={false} className="text-sm text-zinc-400 hover:text-white">&larr; Quotes</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
          Walkthrough: {quote.site.name}
        </h1>
        <p className="text-zinc-400">Measurements &rarr; minutes (override requires reason)</p>
      </div>
      <WalkthroughScopeClient
        quoteId={id}
        areaLines={quote.areaLines.map((l) => ({
          ...l,
          measurements: (l.measurements ?? {}) as Record<string, unknown>,
        }))}
        addOnLines={quote.addOnLines}
        travelMinutesPerVisit={quote.travelMinutesPerVisit}
        winterMinutesPerVisitDelta={quote.winterMinutesPerVisitDelta}
        visitsPerWeek={quote.visitsPerWeek}
        monthlySupplyCostCents={quote.monthlySupplyCostCents}
        expectedSubcontractorRateCentsPerHour={quote.expectedSubcontractorRateCentsPerHour}
        riskFactors={quote.riskFactors as string[] | null}
        buildingClass={quote.buildingClass}
        riskRulesKeys={quote.pricingPolicy?.riskRules && typeof quote.pricingPolicy.riskRules === "object"
          ? Object.keys(quote.pricingPolicy.riskRules as object).filter((k) => !k.startsWith("buildingClass_"))
          : []}
        billingRateCentsPerHour={quote.billingRateCentsPerHour}
        rateCardEntries={rateCardEntries}
      />
    </div>
  );
}
