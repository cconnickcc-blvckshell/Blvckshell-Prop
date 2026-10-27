import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/server/guards/rbac";
import { getQuoteForProposal } from "@/server/actions/quote-actions";
import { formatCad } from "@/lib/pdf/format";
import QuoteProposalClient from "./QuoteProposalClient";
import ProposalQuoteOptions from "./ProposalQuoteOptions";

export const metadata = { title: "Proposal" };

export default async function QuoteProposalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const loaded = await getQuoteForProposal(id);
  if (!loaded) notFound();

  if (!loaded.model) {
    return (
      <div className="w-full space-y-6">
        <Link href={`/admin/quotes/${id}/pricing`} className="text-sm text-zinc-400 hover:text-white">
          ← Pricing
        </Link>
        <p className="text-amber-400">No snapshot yet. Compute snapshot on the pricing page first.</p>
      </div>
    );
  }

  const model = loaded.model;

  return (
    <div className="w-full space-y-6">
      <div>
        <Link href={`/admin/quotes/${id}/pricing`} className="text-sm text-zinc-400 hover:text-white">
          ← Pricing
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Proposal: {model.siteName}</h1>
        <p className="text-zinc-400">
          {model.reference || "Reference pending"} · {model.termsLabel} · valid until {model.validUntilLabel}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Shared wording is edited in{" "}
          <Link href="/admin/settings/proposal" className="text-zinc-300 underline hover:text-white">
            Proposal text
          </Link>
          . Download the branded PDF to send it.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-800 bg-white p-6 text-black print:border-0 print:p-0">
        <div className="mb-4 flex justify-between gap-6 text-sm">
          <div>
            <p className="font-semibold">Client</p>
            <p>{model.clientName}</p>
            <p className="text-zinc-600">{model.contactName}</p>
            <p className="text-zinc-600">{model.contactEmail}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Site</p>
            <p>{model.siteName}</p>
            <p className="text-zinc-600">{model.siteAddress}</p>
          </div>
        </div>
        <div className="mb-4 border-t border-zinc-200 pt-3 text-sm">
          <p>
            Monthly amount:{" "}
            <span className="font-semibold">{formatCad(model.monthlyAmountCents)}/mo</span>
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {model.visitsPerWeek} visits/week. Valid until {model.validUntilLabel}.
          </p>
        </div>
        {model.areas.length > 0 && (
          <ul className="mb-4 space-y-1 text-sm">
            {model.areas.map((area, index) => (
              <li key={`${area.area}-${index}`}>
                <span className="font-medium">{area.area}</span>
                <span className="text-zinc-600"> — {area.detail}</span>
              </li>
            ))}
          </ul>
        )}
        {model.addOns.length > 0 && (
          <ul className="mb-4 space-y-1 text-sm">
            {model.addOns.map((line) => (
              <li key={line.name} className="flex justify-between gap-4">
                <span>{line.name}</span>
                <span>{formatCad(line.priceCents)}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-zinc-500">Price is the monthly amount for the scope listed above.</p>
      </div>
      <QuoteProposalClient quoteId={id} status={loaded.status} hasSnapshot />
      <ProposalQuoteOptions
        quoteId={id}
        terms={loaded.paymentTerms}
        termsLabel={model.termsLabel}
        locked={loaded.status === "WON"}
        sections={loaded.sections}
      />
    </div>
  );
}
