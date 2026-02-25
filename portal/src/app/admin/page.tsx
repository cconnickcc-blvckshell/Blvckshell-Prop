import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCents } from "@/lib/format";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    pendingApproval,
    scheduledToday,
    approvedUnpaid,
    totalJobsMonth,
    revenueMonth,
    payoutsPendingMonth,
    overdueInvoices,
    activeWorkers,
    recentAudit,
  ] = await Promise.all([
    prisma.job.count({ where: { status: "COMPLETED_PENDING_APPROVAL" } }),
    prisma.job.count({
      where: {
        status: "SCHEDULED",
        scheduledStart: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        },
      },
    }),
    prisma.job.count({ where: { status: "APPROVED_PAYABLE" } }),
    prisma.job.count({
      where: { scheduledStart: { gte: monthStart, lte: monthEnd }, status: { not: "CANCELLED" } },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["Sent", "Paid"] }, periodStart: { gte: monthStart } },
      _sum: { totalCents: true },
    }),
    prisma.payoutLine.aggregate({
      where: { status: "PENDING" },
      _sum: { amountCents: true },
    }),
    prisma.invoice.count({
      where: { status: "Sent", dueAt: { lt: now } },
    }),
    prisma.worker.count({ where: { isActive: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        fromState: true,
        toState: true,
        createdAt: true,
        actorUser: { select: { name: true } },
      },
    }),
  ]);

  const revenueCents = revenueMonth._sum.totalCents ?? 0;
  const payoutsPending = payoutsPendingMonth._sum.amountCents ?? 0;

  const cards = [
    { label: "Pending Approval", value: pendingApproval, href: "/admin/jobs", color: "text-amber-400", urgent: pendingApproval > 0 },
    { label: "Scheduled Today", value: scheduledToday, href: "/admin/jobs", color: "text-blue-400" },
    { label: "Approved (Unpaid)", value: approvedUnpaid, href: "/admin/payouts", color: "text-emerald-400" },
    { label: "Overdue Invoices", value: overdueInvoices, href: "/admin/invoices", color: "text-red-400", urgent: overdueInvoices > 0 },
    { label: "Revenue (Month)", value: formatCents(revenueCents), href: "/admin/invoices", color: "text-white" },
    { label: "Payouts Pending", value: formatCents(payoutsPending), href: "/admin/payouts", color: "text-amber-400" },
    { label: "Jobs (Month)", value: totalJobsMonth, href: "/admin/jobs", color: "text-white" },
    { label: "Active Workers", value: activeWorkers, href: "/admin/workforce", color: "text-white" },
  ];

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-zinc-400">
          {now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border bg-zinc-900/50 p-4 shadow-xl transition hover:border-zinc-600 ${
              card.urgent ? "border-amber-500/50" : "border-zinc-800"
            }`}
          >
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="mt-1 text-xs text-zinc-500">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/jobs"
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Review pending jobs
        </Link>
        <Link
          href="/admin/invoices/new"
          className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Create invoice
        </Link>
        <Link
          href="/admin/jobs/new"
          className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Create job
        </Link>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent activity</h2>
        {recentAudit.length === 0 ? (
          <p className="text-sm text-zinc-500">No recent activity.</p>
        ) : (
          <div className="space-y-3">
            {recentAudit.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-zinc-300 truncate">
                    {log.actorUser.name} — {log.entityType}
                    {log.fromState && log.toState && `: ${log.fromState} → ${log.toState}`}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-zinc-600">
                  {new Date(log.createdAt).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
        <Link
          href="/admin/audit"
          className="mt-3 inline-block text-xs text-emerald-400 hover:text-emerald-300"
        >
          View full audit log →
        </Link>
      </div>
    </div>
  );
}
