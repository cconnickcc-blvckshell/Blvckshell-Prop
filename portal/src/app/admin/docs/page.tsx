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

      {/* Business Plan - Featured Document */}
      <section className="mb-10">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">Business Plan</h2>
        <p className="mb-4 text-sm text-zinc-400">Ontario regional business plan for bank and investor review</p>
        <Link
          href="/admin/docs/business-plan"
          className="group flex items-center gap-4 rounded-xl border border-amber-800/50 bg-gradient-to-r from-amber-900/20 to-zinc-900/50 p-5 shadow-lg transition-all duration-200 hover:border-amber-600/50 hover:from-amber-900/30 hover:shadow-xl active:scale-[0.995] sm:p-6"
        >
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-amber-600/20 text-amber-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <span className="font-semibold text-white group-hover:text-amber-400">Ontario Regional Business Plan</span>
            <span className="mt-1 block text-xs text-zinc-400">Q1 2026 | Confidential | Bank & Investor Ready</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-amber-500/80">
            <span>View</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </section>

      {checklists.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">Checklists</h2>
          <p className="mb-4 text-sm text-zinc-400">Area-specific cleaning checklists for common areas (lobby, hallway, washroom, etc.)</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {checklists.map(({ slug, title }) => (
              <Link
                key={slug}
                href={`/admin/docs/checklists/${encodeURIComponent(slug)}`}
                className="group flex min-h-[72px] flex-col justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-lg transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/60 hover:shadow-xl active:scale-[0.99] sm:min-h-[80px] sm:p-6"
              >
                <span className="font-medium text-white group-hover:text-emerald-400">{title}</span>
                <span className="mt-1 text-xs text-zinc-500">View & print</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {sops.length > 0 && (
        <section>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wider text-zinc-500">Standard operating procedures</h2>
          <p className="mb-4 text-sm text-zinc-400">Step-by-step procedures for cleaning, access, completion, and incidents</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {sops.map(({ slug, title }) => (
              <Link
                key={slug}
                href={`/admin/docs/sops/${encodeURIComponent(slug)}`}
                className="group flex min-h-[72px] flex-col justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-lg transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/60 hover:shadow-xl active:scale-[0.99] sm:min-h-[80px] sm:p-6"
              >
                <span className="font-medium text-white group-hover:text-emerald-400">{title}</span>
                <span className="mt-1 text-xs text-zinc-500">View & print</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {checklists.length === 0 && sops.length === 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
          <p className="text-sm text-zinc-500">
            Documentation will appear here once checklists and SOPs are added to the system.
          </p>
        </div>
      )}
    </div>
  );
}
