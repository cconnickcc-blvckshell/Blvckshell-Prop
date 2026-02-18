import { requireAdmin } from "@/server/guards/rbac";
import { getChecklistSlugs, getSopSlugs } from "@/lib/docs";
import Link from "next/link";

export default async function AdminDocsPage() {
  await requireAdmin();

  const checklists = getChecklistSlugs();
  const sops = getSopSlugs();

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Documentation</h1>
        <p className="mt-1 text-zinc-400">Checklists and SOPs — view and print / save as PDF</p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">Checklists</h2>
          <p className="mt-1 text-sm text-zinc-400">Area-specific cleaning checklists (CL_01–CL_08)</p>
          <ul className="mt-4 space-y-2">
            {checklists.length === 0 ? (
              <li className="text-sm text-zinc-500">No checklists in content/docs/checklists yet.</li>
            ) : (
              checklists.map(({ slug, title }) => (
                <li key={slug}>
                  <Link
                    href={`/admin/docs/checklists/${encodeURIComponent(slug)}`}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    {title}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold text-white">SOPs</h2>
          <p className="mt-1 text-sm text-zinc-400">Standard operating procedures</p>
          <ul className="mt-4 space-y-2">
            {sops.length === 0 ? (
              <li className="text-sm text-zinc-500">No SOPs in content/docs/sops yet.</li>
            ) : (
              sops.map(({ slug, title }) => (
                <li key={slug}>
                  <Link
                    href={`/admin/docs/sops/${encodeURIComponent(slug)}`}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    {title}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
