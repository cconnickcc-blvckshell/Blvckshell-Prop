import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCents, formatJobStatus, formatDate } from "@/lib/format";
import { logError } from "@/lib/logger";

export default async function AdminDashboardPage() {
  await requireAdmin();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  let pendingApproval = 0;
  let scheduledToday = 0;
  let approvedUnpaid = 0;
  let totalJobsMonth = 0;
  let paidJobsMonth = 0;
  let revenueCents = 0;
  let paidRevenueCents = 0;
  let payoutsPending = 0;
  let overdueInvoices = 0;
  let activeWorkers = 0;
  let complianceIssues = 0;
  type TodayJob = { id: string; scheduledStart: Date; status: string; checkedInAt: Date | null; site: { name: string; address: string }; assignedWorker: { user: { name: string } } | null };
  let todayJobs: TodayJob[] = [];
  type AuditEntry = { id: string; entityType: string; fromState: string | null; toState: string | null; createdAt: Date; actorUserId: string };
  let recentAudit: AuditEntry[] = [];
  type UrgentItem = { type: string; label: string; href: string; count?: number };
  let urgentItems: UrgentItem[] = [];

  try {
    const results = await Promise.all([
      prisma.job.count({ where: { status: "COMPLETED_PENDING_APPROVAL" } }),
      prisma.job.count({ where: { status: "SCHEDULED", scheduledStart: { gte: todayStart, lt: todayEnd } } }),
      prisma.job.count({ where: { status: "APPROVED_PAYABLE" } }),
      prisma.job.count({ where: { scheduledStart: { gte: monthStart, lte: monthEnd }, status: { not: "CANCELLED" } } }),
      prisma.job.count({ where: { scheduledStart: { gte: monthStart, lte: monthEnd }, status: "PAID" } }),
      prisma.invoice.aggregate({ where: { status: { in: ["Sent", "Paid"] }, periodStart: { gte: monthStart } }, _sum: { totalCents: true } }),
      prisma.invoice.aggregate({ where: { status: "Paid", periodStart: { gte: monthStart } }, _sum: { totalCents: true } }),
      prisma.payoutLine.aggregate({ where: { status: "PENDING" }, _sum: { amountCents: true } }),
      prisma.invoice.count({ where: { status: "Sent", dueAt: { lt: now } } }),
      prisma.worker.count({ where: { isActive: true } }),
      prisma.workforceAccount.count({ where: { complianceSuspended: true } }),
      prisma.job.findMany({
        where: { status: { in: ["SCHEDULED", "COMPLETED_PENDING_APPROVAL"] }, scheduledStart: { gte: todayStart, lt: todayEnd } },
        select: { id: true, scheduledStart: true, status: true, checkedInAt: true, site: { select: { name: true, address: true } }, assignedWorker: { select: { user: { select: { name: true } } } } },
        orderBy: { scheduledStart: "asc" },
        take: 10,
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, entityType: true, fromState: true, toState: true, createdAt: true, actorUserId: true },
      }),
    ]);

    pendingApproval = results[0];
    scheduledToday = results[1];
    approvedUnpaid = results[2];
    totalJobsMonth = results[3];
    paidJobsMonth = results[4];
    revenueCents = results[5]._sum.totalCents ?? 0;
    paidRevenueCents = results[6]._sum.totalCents ?? 0;
    payoutsPending = results[7]._sum.amountCents ?? 0;
    overdueInvoices = results[8];
    activeWorkers = results[9];
    complianceIssues = results[10];
    todayJobs = results[11];
    recentAudit = results[12];

    if (pendingApproval > 0) urgentItems.push({ type: "approval", label: `${pendingApproval} job${pendingApproval > 1 ? "s" : ""} awaiting approval`, href: "/admin/jobs", count: pendingApproval });
    if (overdueInvoices > 0) urgentItems.push({ type: "overdue", label: `${overdueInvoices} overdue invoice${overdueInvoices > 1 ? "s" : ""}`, href: "/admin/invoices", count: overdueInvoices });
    if (complianceIssues > 0) urgentItems.push({ type: "compliance", label: `${complianceIssues} account${complianceIssues > 1 ? "s" : ""} compliance-suspended`, href: "/admin/workforce", count: complianceIssues });
    if (approvedUnpaid > 0) urgentItems.push({ type: "payout", label: `${approvedUnpaid} approved job${approvedUnpaid > 1 ? "s" : ""} awaiting payout`, href: "/admin/payouts", count: approvedUnpaid });
  } catch (error) {
    logError(error, { where: "admin-dashboard" });
  }

  const completionRate = totalJobsMonth > 0 ? Math.round((paidJobsMonth / totalJobsMonth) * 100) : 0;
  const collectionRate = revenueCents > 0 ? Math.round((paidRevenueCents / revenueCents) * 100) : 0;
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">{greeting}</p>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Operations Dashboard</h1>
        </div>
        <p className="text-sm text-zinc-500">
          {now.toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Urgent attention bar */}
      {urgentItems.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-red-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-amber-300">Needs attention</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {urgentItems.map((item) => (
              <Link
                key={item.type}
                href={item.href}
                prefetch={false}
                className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 transition hover:bg-amber-500/20 hover:border-amber-500/40"
              >
                <span className="font-semibold text-amber-400">{item.count}</span>
                {item.label.replace(/^\d+\s/, "")}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Hero metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/admin/jobs" prefetch={false} className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl transition hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-white">{scheduledToday}</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Jobs today</p>
        </Link>

        <Link href="/admin/jobs" prefetch={false} className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl transition hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <p className={`text-3xl font-bold ${pendingApproval > 0 ? "text-amber-400" : "text-white"}`}>{pendingApproval}</p>
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${pendingApproval > 0 ? "bg-amber-500/10 text-amber-400" : "bg-zinc-800 text-zinc-500"}`}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Pending approval</p>
        </Link>

        <Link href="/admin/invoices" prefetch={false} className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl transition hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-emerald-400">{formatCents(revenueCents)}</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Revenue this month</p>
        </Link>

        <Link href="/admin/workforce" prefetch={false} className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl transition hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-white">{activeWorkers}</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Active workers</p>
        </Link>
      </div>

      {/* Secondary metrics bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-white">{totalJobsMonth}</p>
              <p className="text-[10px] text-zinc-500">Jobs this month</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-400">{completionRate}%</p>
              <p className="text-[10px] text-zinc-500">Completion</p>
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-zinc-800">
            <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-white">{formatCents(revenueCents)}</p>
              <p className="text-[10px] text-zinc-500">Invoiced</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-400">{collectionRate}%</p>
              <p className="text-[10px] text-zinc-500">Collected</p>
            </div>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-zinc-800">
            <div className="h-1.5 rounded-full bg-emerald-500 transition-all" style={{ width: `${collectionRate}%` }} />
          </div>
        </div>

        <Link href="/admin/payouts" prefetch={false} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700">
          <p className="text-lg font-bold text-amber-400">{formatCents(payoutsPending)}</p>
          <p className="text-[10px] text-zinc-500">Payouts pending</p>
          <p className="mt-1 text-xs text-zinc-600">{approvedUnpaid} jobs</p>
        </Link>

        <Link href="/admin/invoices" prefetch={false} className={`rounded-xl border bg-zinc-900/50 p-4 hover:border-zinc-700 ${overdueInvoices > 0 ? "border-red-500/30" : "border-zinc-800"}`}>
          <p className={`text-lg font-bold ${overdueInvoices > 0 ? "text-red-400" : "text-zinc-400"}`}>{overdueInvoices}</p>
          <p className="text-[10px] text-zinc-500">Overdue invoices</p>
          {complianceIssues > 0 && <p className="mt-1 text-xs text-red-400">{complianceIssues} compliance issue{complianceIssues > 1 ? "s" : ""}</p>}
        </Link>
      </div>

      {/* Two-column: Today's operations + Activity feed */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Today's jobs — wider */}
        <div className="lg:col-span-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Today&apos;s operations</h2>
            <Link href="/admin/jobs" prefetch={false} className="text-xs text-emerald-400 hover:text-emerald-300">All jobs →</Link>
          </div>
          {todayJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                <svg className="h-6 w-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              </div>
              <p className="text-sm text-zinc-500">No jobs scheduled today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayJobs.map((job) => {
                const time = new Date(job.scheduledStart).toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" });
                const isPending = job.status === "COMPLETED_PENDING_APPROVAL";
                return (
                  <Link
                    key={job.id}
                    href={`/admin/jobs/${job.id}`}
                    prefetch={false}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 transition hover:border-zinc-700 hover:bg-zinc-800/50"
                  >
                    <div className="flex flex-col items-center shrink-0 w-14">
                      <span className="text-sm font-semibold text-white">{time}</span>
                    </div>
                    <div className="h-8 w-px bg-zinc-700" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{job.site.name}</p>
                      <p className="text-xs text-zinc-500 truncate">
                        {job.assignedWorker?.user.name ?? "Unassigned"} · {job.site.address}
                      </p>
                    </div>
                    <span className={`shrink-0 h-2.5 w-2.5 rounded-full ${isPending ? "bg-amber-400 animate-pulse" : job.checkedInAt ? "bg-emerald-400" : "bg-blue-400"}`} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity feed — narrower */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Activity</h2>
            <Link href="/admin/audit" prefetch={false} className="text-xs text-emerald-400 hover:text-emerald-300">Audit log →</Link>
          </div>
          {recentAudit.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">No recent activity</p>
          ) : (
            <div className="space-y-1">
              {recentAudit.map((log) => {
                const mins = Math.round((now.getTime() - new Date(log.createdAt).getTime()) / 60000);
                const timeAgo = mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins / 60)}h ago` : `${Math.floor(mins / 1440)}d ago`;
                return (
                  <div key={log.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-zinc-800/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${log.toState ? "bg-emerald-400" : "bg-zinc-500"}`} />
                      <span className="text-xs text-zinc-400 truncate">
                        {log.entityType}
                        {log.fromState && log.toState && (
                          <span className="text-zinc-600"> {log.fromState} → <span className="text-zinc-300">{log.toState}</span></span>
                        )}
                      </span>
                    </div>
                    <span className="shrink-0 text-[10px] text-zinc-600 ml-2">{timeAgo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/jobs" prefetch={false} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition">
          Review pending jobs
        </Link>
        <Link href="/admin/invoices/new" prefetch={false} className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition">
          Create invoice
        </Link>
        <Link href="/admin/jobs/new" prefetch={false} className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition">
          Create job
        </Link>
        <Link href="/admin/workforce/new" prefetch={false} className="rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition">
          Add workforce
        </Link>
      </div>
    </div>
  );
}
