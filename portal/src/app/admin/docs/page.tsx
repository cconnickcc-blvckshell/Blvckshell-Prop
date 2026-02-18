import { requireAdmin } from "@/server/guards/rbac";
import { getChecklistSlugs, getSopSlugs } from "@/lib/docs";
import Link from "next/link";

export default async function AdminDocsPage() {
  await requireAdmin();

  const checklists = getChecklistSlugs();
  const sops = getSopSlugs();

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Documentation</h1>
        <p className="mt-2 text-zinc-400">
          Checklists and standard operating procedures. Open any doc to view or print / save as PDF.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">Checklists</h2>
        <p className="mb-4 text-sm text-zinc-400">Area-specific cleaning checklists for common areas (lobby, hallway, washroom, etc.)</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {checklists.length === 0 ? (
            <p className="col-span-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-500">
              No checklists in content/docs/checklists yet.
            </p>
          ) : (
            checklists.map(({ slug, title }) => (
              <Link
                key={slug}
                href={`/admin/docs/checklists/${encodeURIComponent(slug)}`}
                className="group flex min-h-[72px] flex-col justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-lg transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/60 hover:shadow-xl active:scale-[0.99] sm:min-h-[80px] sm:p-6"
              >
                <span className="font-medium text-white group-hover:text-emerald-400">{title}</span>
                <span className="mt-1 text-xs text-zinc-500">View & print</span>
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">Standard operating procedures</h2>
        <p className="mb-4 text-sm text-zinc-400">Step-by-step procedures for cleaning, access, completion, and incidents</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          {sops.length === 0 ? (
            <p className="col-span-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-500">
              No SOPs in content/docs/sops yet.
            </p>
          ) : (
            sops.map(({ slug, title }) => (
              <Link
                key={slug}
                href={`/admin/docs/sops/${encodeURIComponent(slug)}`}
                className="group flex min-h-[72px] flex-col justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-lg transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/60 hover:shadow-xl active:scale-[0.99] sm:min-h-[80px] sm:p-6"
              >
                <span className="font-medium text-white group-hover:text-emerald-400">{title}</span>
                <span className="mt-1 text-xs text-zinc-500">View & print</span>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
