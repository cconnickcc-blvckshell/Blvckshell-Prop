import { requireAdmin } from "@/server/guards/rbac";
import { listProposalSections } from "@/server/actions/proposal-content-actions";
import ProposalSectionsForm from "./ProposalSectionsForm";

export const metadata = { title: "Proposal text" };

export default async function ProposalSettingsPage() {
  await requireAdmin();
  const sections = await listProposalSections();

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Proposal text</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          This is the shared wording for client proposal PDFs. Client, site, areas, frequency, add-ons, and price still
          come from each quote. Paste your own section text here. A quote can override one section without changing the
          default.
        </p>
      </div>
      <ProposalSectionsForm sections={sections} />
    </div>
  );
}
