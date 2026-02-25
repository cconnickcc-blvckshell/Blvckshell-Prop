import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { getActiveRateCard } from "@/server/actions/rate-card-actions";
import PricingPolicyEditor from "./PricingPolicyEditor";
import RateCardEditor from "@/components/admin/RateCardEditor";

export default async function PricingPolicyPage() {
  await requireAdmin();

  const [policies, rateCard] = await Promise.all([
    prisma.pricingPolicy.findMany({
      orderBy: [{ cityCode: "asc" }, { effectiveDate: "desc" }],
    }),
    getActiveRateCard(),
  ]);

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Pricing Policies</h1>
        <p className="mt-1 text-zinc-400">Configure billing rates, margins, and constraints for quotes</p>
      </div>
      <PricingPolicyEditor policies={JSON.parse(JSON.stringify(policies))} />

      {/* Rate Card Editor */}
      <div className="border-t border-zinc-800 pt-8">
        {rateCard ? (
          <RateCardEditor
            rateCardId={rateCard.id}
            version={rateCard.version}
            entries={JSON.parse(JSON.stringify(rateCard.entries))}
          />
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-zinc-400">No active rate card found. Run the seed script to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
