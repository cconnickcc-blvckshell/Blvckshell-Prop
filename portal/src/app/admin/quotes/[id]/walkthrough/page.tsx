import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getQuote } from "@/server/actions/quote-actions";
import Link from "next/link";
import WalkthroughScopeClient from "./WalkthroughScopeClient";

export default async function QuoteWalkthroughPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href="/admin/quotes" className="text-sm text-zinc-400 hover:text-white">← Quotes</Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
          Walkthrough: {quote.site.name}
        </h1>
        <p className="text-zinc-400">Measurements → minutes (override requires reason)</p>
      </div>
      <WalkthroughScopeClient
        quoteId={id}
        areaLines={quote.areaLines}
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
      />
    </div>
  );
}
