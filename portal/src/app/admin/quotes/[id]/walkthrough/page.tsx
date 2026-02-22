import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getQuote } from "@/server/actions/quote-actions";
import Link from "next/link";

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
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <p className="text-zinc-400">
          Area lines: {quote.areaLines.length}. Add-on lines: {quote.addOnLines.length}.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href={`/admin/quotes/${id}/pricing`}
            className="rounded-lg bg-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-500"
          >
            Go to pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
