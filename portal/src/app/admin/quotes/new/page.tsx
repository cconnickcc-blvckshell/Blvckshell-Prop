import { requireAdmin } from "@/server/guards/rbac";
import { getPricingPolicies, getSitesForQuote } from "@/server/actions/quote-actions";
import CreateQuoteForm from "./CreateQuoteForm";

export default async function NewQuotePage() {
  await requireAdmin();
  const [policies, sites] = await Promise.all([
    getPricingPolicies(),
    getSitesForQuote(),
  ]);

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">New quote</h1>
      <CreateQuoteForm policies={policies} sites={sites} />
    </div>
  );
}
