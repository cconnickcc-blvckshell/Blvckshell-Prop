"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createQuote } from "@/server/actions/quote-actions";

type Policy = { id: string; cityCode: string; effectiveDate: Date; version: number; anchorBillingRateCentsPerHour: number; minimumMonthlyRevenueCents: number; daysValid: number };
type Site = { id: string; name: string; address: string };

export default function CreateQuoteForm({
  policies,
  sites,
}: {
  policies: Policy[];
  sites: Site[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = e.currentTarget;
    const siteId = (form.elements.namedItem("siteId") as HTMLSelectElement).value;
    const pricingPolicyId = (form.elements.namedItem("pricingPolicyId") as HTMLSelectElement).value;
    const result = await createQuote(siteId, pricingPolicyId);
    setPending(false);
    if (result.ok) {
      router.push(`/admin/quotes/${result.quoteId}/walkthrough`);
    } else {
      setError(result.error ?? "Failed");
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div>
        <label htmlFor="siteId" className="block text-sm font-medium text-zinc-300">Site</label>
        <select
          id="siteId"
          name="siteId"
          required
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
        >
          <option value="">Select site</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name} — {s.address}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="pricingPolicyId" className="block text-sm font-medium text-zinc-300">Pricing policy</label>
        <select
          id="pricingPolicyId"
          name="pricingPolicyId"
          required
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-2 text-white"
        >
          <option value="">Select policy</option>
          {policies.map((p) => (
            <option key={p.id} value={p.id}>
              {p.cityCode} • v{p.version} • ${(p.anchorBillingRateCentsPerHour / 100).toFixed(0)}/hr
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {pending ? "Creating…" : "Create quote"}
      </button>
    </form>
  );
}
