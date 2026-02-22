import { requireAdmin } from "@/server/guards/rbac";
import { listSiteSnapshots, getSitesForFinance } from "@/server/actions/finance-actions";
import Link from "next/link";

export default async function AdminFinancePage() {
  await requireAdmin();
  const [snapshots, sites] = await Promise.all([
    listSiteSnapshots(),
    getSitesForFinance(),
  ]);

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-white">Finance</h1>
      <p className="text-zinc-400">
        Site performance snapshots • AR aging • Close month • Exports (CSV / investor pack)
      </p>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Site snapshots</h2>
        {snapshots.length === 0 ? (
          <p className="text-zinc-500">No snapshots yet. Compute from site + month.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {snapshots.slice(0, 50).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-white">{s.site.name}</span>
                <span className="text-zinc-400">
                  {new Date(s.month).toLocaleDateString("en-CA", { year: "numeric", month: "short" })} v{s.version}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs ${
                    s.status === "CLOSED"
                      ? "border-amber-500/40 bg-amber-500/20 text-amber-300"
                      : "border-zinc-500/40 bg-zinc-500/20 text-zinc-300"
                  }`}
                >
                  {s.status}
                </span>
                <span className="text-zinc-400">
                  Net ${(s.netRevenueCents / 100).toFixed(0)} • Margin {(s.grossMarginBps / 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-sm text-zinc-500">
        Month selector + compute snapshots on demand; close month makes CLOSED snapshots immutable. Exports: CSV + investor pack (wire as needed).
      </p>
    </div>
  );
}
