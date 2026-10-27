import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getQuote } from "@/server/actions/quote-actions";
import { formatCalendarDate, formatCents, formatDateTime, formatQuoteStatus } from "@/lib/format";

export const metadata = { title: "Quote" };

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const links = [
    { href: `/admin/quotes/${id}/walkthrough`, label: "Walkthrough" },
    { href: `/admin/quotes/${id}/pricing`, label: "Pricing" },
    { href: `/admin/quotes/${id}/proposal`, label: "Proposal" },
  ];

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href="/admin/quotes" className="text-sm text-zinc-400 hover:text-white">
          ← Quotes
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">{quote.site.name}</h1>
        <p className="text-zinc-400">{quote.site.address}</p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Status</dt>
            <dd className="text-white">{formatQuoteStatus(quote.status)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Policy</dt>
            <dd className="text-white">
              {quote.pricingPolicy.cityCode} v{quote.pricingPolicy.version} ·{" "}
              {formatCalendarDate(quote.pricingPolicy.effectiveDate)}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Visits / week</dt>
            <dd className="text-white">{quote.visitsPerWeek}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Billing rate</dt>
            <dd className="text-white">{formatCents(quote.billingRateCentsPerHour)}/hr</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Created</dt>
            <dd className="text-white">{formatDateTime(quote.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Expires</dt>
            <dd className="text-white">{formatDateTime(quote.expiresAt)}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-wrap gap-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
