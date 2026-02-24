import { requireAdmin } from "@/server/guards/rbac";
import { listQuotes } from "@/server/actions/quote-actions";
import Link from "next/link";
import { formatQuoteStatus } from "@/lib/format";

export default async function AdminQuotesPage() {
  await requireAdmin();
  const quotes = await listQuotes();

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Quotes</h1>
        <Link
          href="/admin/quotes/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          New quote
        </Link>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        {quotes.length === 0 ? (
          <p className="text-zinc-400">No quotes yet. Create one from a site and pricing policy.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {quotes.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                <div>
                  <Link
                    href={`/admin/quotes/${q.id}/walkthrough`}
                    className="font-medium text-white hover:underline"
                  >
                    {q.site.name}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {q.pricingPolicy.cityCode} • {q.visitsPerWeek} visits/wk • {formatQuoteStatus(q.status)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
                      q.status === "SENT"
                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                        : q.status === "DRAFT"
                          ? "border-zinc-500/40 bg-zinc-500/20 text-zinc-300"
                          : "border-amber-500/40 bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {formatQuoteStatus(q.status)}
                  </span>
                  <Link
                    href={`/admin/quotes/${q.id}/pricing`}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    Pricing
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
