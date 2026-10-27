import { requireAdmin } from "@/server/guards/rbac";
import { listProposalAreaTasks, listProposalSections } from "@/server/actions/proposal-content-actions";
import ProposalSectionsForm from "./ProposalSectionsForm";
import ProposalTasksForm from "./ProposalTasksForm";

export const metadata = { title: "Proposal text" };

export default async function ProposalSettingsPage() {
  await requireAdmin();
  const [sections, tasks] = await Promise.all([listProposalSections(), listProposalAreaTasks()]);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Proposal text</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          This is the shared wording for client proposal PDFs. Client, site, areas, frequency, add-ons, and price still
          come from each quote. Paste your own section text here, and edit the default task list for each area. A quote
          can override either one without changing the default.
        </p>
      </div>
      <ProposalSectionsForm sections={sections} />
      <div>
        <h2 className="text-xl font-semibold text-white">Default tasks</h2>
        <p className="mt-1 max-w-2xl text-sm text-zinc-400">
          Used when a quote area has no task list of its own. Frequency “Each visit” follows that quote’s visits per week.
        </p>
      </div>
      <ProposalTasksForm tasks={tasks} />
    </div>
  );
}
