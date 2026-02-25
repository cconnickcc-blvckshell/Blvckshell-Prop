import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import PricingPolicyEditor from "./PricingPolicyEditor";

export default async function PricingPolicyPage() {
  await requireAdmin();

  const policies = await prisma.pricingPolicy.findMany({
    orderBy: [{ cityCode: "asc" }, { effectiveDate: "desc" }],
  });

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Pricing Policies</h1>
        <p className="mt-1 text-zinc-400">Configure billing rates, margins, and constraints for quotes</p>
      </div>
      <PricingPolicyEditor policies={JSON.parse(JSON.stringify(policies))} />
    </div>
  );
}
