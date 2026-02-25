import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "—";
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function pctColor(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "text-zinc-400";
  return current >= previous ? "text-emerald-400" : "text-red-400";
}

export default async function AdminAnalyticsPage() {
  await requireAdmin();

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // Revenue: sum of invoice totalCents for Sent/Paid invoices this month vs last month
  const [thisMonthInvoices, lastMonthInvoices] = await Promise.all([
    prisma.invoice.aggregate({
      where: {
        status: { in: ["Sent", "Paid"] },
        issuedAt: { gte: thisMonthStart },
      },
      _sum: { totalCents: true },
      _count: true,
    }),
    prisma.invoice.aggregate({
      where: {
        status: { in: ["Sent", "Paid"] },
        issuedAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { totalCents: true },
      _count: true,
    }),
  ]);

  const revenueThisMonth = thisMonthInvoices._sum.totalCents ?? 0;
  const revenueLastMonth = lastMonthInvoices._sum.totalCents ?? 0;

  // Outstanding (unpaid invoices)
  const outstandingInvoices = await prisma.invoice.findMany({
    where: { status: "Sent" },
    select: { totalCents: true, issuedAt: true, dueAt: true },
  });
  const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.totalCents, 0);

  // Aging breakdown
  const aging = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  for (const inv of outstandingInvoices) {
    const daysOld = Math.floor((now.getTime() - (inv.issuedAt?.getTime() ?? now.getTime())) / (1000 * 60 * 60 * 24));
    if (daysOld <= 30) aging["0-30"] += inv.totalCents;
    else if (daysOld <= 60) aging["31-60"] += inv.totalCents;
    else if (daysOld <= 90) aging["61-90"] += inv.totalCents;
    else aging["90+"] += inv.totalCents;
  }

  // Top 5 sites by revenue (using invoice line items)
  const topSitesRaw = await prisma.invoiceLineItem.groupBy({
    by: ["siteId"],
    _sum: { amountCents: true },
    orderBy: { _sum: { amountCents: "desc" } },
    take: 5,
  });
  const topSiteIds = topSitesRaw.map((s) => s.siteId);
  const topSiteNames = await prisma.site.findMany({
    where: { id: { in: topSiteIds } },
    select: { id: true, name: true },
  });
  const siteNameMap = new Map(topSiteNames.map((s) => [s.id, s.name]));
  const topSites = topSitesRaw.map((s) => ({
    name: siteNameMap.get(s.siteId) ?? s.siteId,
    revenue: s._sum.amountCents ?? 0,
  }));

  // Payout ratio
  const totalPayoutsResult = await prisma.payoutLine.aggregate({
    where: { status: { in: ["APPROVED", "RELEASED", "PAID"] } },
    _sum: { amountCents: true },
  });
  const totalPayouts = totalPayoutsResult._sum.amountCents ?? 0;
  const totalRevenueAll = await prisma.invoice.aggregate({
    where: { status: { in: ["Sent", "Paid"] } },
    _sum: { totalCents: true },
  });
  const totalRevenue = totalRevenueAll._sum.totalCents ?? 1;
  const payoutRatio = totalRevenue > 0 ? ((totalPayouts / totalRevenue) * 100).toFixed(1) : "0.0";

  // Jobs this month vs last month
  const [jobsThisMonth, jobsLastMonth] = await Promise.all([
    prisma.job.count({
      where: { scheduledStart: { gte: thisMonthStart }, status: { not: "CANCELLED" } },
    }),
    prisma.job.count({
      where: {
        scheduledStart: { gte: lastMonthStart, lte: lastMonthEnd },
        status: { not: "CANCELLED" },
      },
    }),
  ]);

  const fmt = (cents: number) => `$${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`;

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Analytics</h1>
        <p className="mt-1 text-zinc-400">Financial overview and key metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Revenue this month</p>
          <p className="mt-2 text-2xl font-bold text-white">{fmt(revenueThisMonth)}</p>
          <p className={`mt-1 text-sm ${pctColor(revenueThisMonth, revenueLastMonth)}`}>
            {pctChange(revenueThisMonth, revenueLastMonth)} vs last month
          </p>
        </div>

        {/* Outstanding */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total outstanding</p>
          <p className="mt-2 text-2xl font-bold text-white">{fmt(totalOutstanding)}</p>
          <p className="mt-1 text-sm text-zinc-400">{outstandingInvoices.length} unpaid invoice(s)</p>
        </div>

        {/* Payout ratio */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Payout ratio</p>
          <p className="mt-2 text-2xl font-bold text-white">{payoutRatio}%</p>
          <p className="mt-1 text-sm text-zinc-400">Payouts / Revenue</p>
        </div>

        {/* Jobs */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Jobs this month</p>
          <p className="mt-2 text-2xl font-bold text-white">{jobsThisMonth}</p>
          <p className={`mt-1 text-sm ${pctColor(jobsThisMonth, jobsLastMonth)}`}>
            {pctChange(jobsThisMonth, jobsLastMonth)} vs last month ({jobsLastMonth})
          </p>
        </div>
      </div>

      {/* Aging Breakdown */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">AR Aging Breakdown</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {(Object.entries(aging) as [string, number][]).map(([bracket, cents]) => (
            <div key={bracket} className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 text-center">
              <p className="text-xs font-medium text-zinc-400">{bracket} days</p>
              <p className={`mt-1 text-lg font-bold ${cents > 0 ? "text-amber-300" : "text-zinc-500"}`}>
                {fmt(cents)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Sites */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Top Sites by Revenue</h2>
        {topSites.length === 0 ? (
          <p className="text-zinc-500">No invoice line items yet.</p>
        ) : (
          <ul className="space-y-3">
            {topSites.map((site, i) => (
              <li key={i} className="flex items-center justify-between border-b border-zinc-800 pb-2 last:border-b-0 last:pb-0">
                <span className="text-white">{site.name}</span>
                <span className="font-medium text-emerald-400">{fmt(site.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-sm text-zinc-500">
        Revenue figures based on Sent + Paid invoices. Aging uses invoice issue date. See{" "}
        <Link href="/admin/finance" prefetch={false} className="text-emerald-400 hover:text-emerald-300">Finance</Link>{" "}
        for detailed site snapshots.
      </p>
    </div>
  );
}
