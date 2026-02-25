import { requireClient } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCents, formatDate } from "@/lib/format";

export default async function ClientDashboardPage() {
  const user = await requireClient();
  const clientId = user.clientOrganizationId!;

  const [siteCount, jobCount, invoiceCount, outstandingInvoices, upcomingJobs, org] = await Promise.all([
    prisma.site.count({ where: { clientOrganizationId: clientId } }),
    prisma.job.count({
      where: { site: { clientOrganizationId: clientId }, status: { not: "CANCELLED" } },
    }),
    prisma.invoice.count({
      where: { clientId, status: { not: "Void" } },
    }),
    prisma.invoice.findMany({
      where: { clientId, status: "Sent" },
      select: { id: true, invoiceNumber: true, totalCents: true, dueAt: true },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
    prisma.job.findMany({
      where: {
        site: { clientOrganizationId: clientId },
        status: "SCHEDULED",
        scheduledStart: { gte: new Date() },
      },
      select: {
        id: true,
        scheduledStart: true,
        site: { select: { name: true } },
      },
      orderBy: { scheduledStart: "asc" },
      take: 5,
    }),
    prisma.clientOrganization.findUnique({
      where: { id: clientId },
      select: { name: true },
    }),
  ]);

  const outstandingTotal = outstandingInvoices.reduce((s, i) => s + i.totalCents, 0);
  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Welcome, {org?.name ?? "Client"}
        </h1>
        <p className="mt-1 text-zinc-400">Your facilities services overview</p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/client/sites"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700"
        >
          <p className="text-3xl font-bold text-white">{siteCount}</p>
          <p className="mt-1 text-sm text-zinc-400">Sites</p>
        </Link>
        <Link
          href="/client/jobs"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700"
        >
          <p className="text-3xl font-bold text-white">{jobCount}</p>
          <p className="mt-1 text-sm text-zinc-400">Jobs</p>
        </Link>
        <Link
          href="/client/invoices"
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700"
        >
          <p className="text-3xl font-bold text-white">{invoiceCount}</p>
          <p className="mt-1 text-sm text-zinc-400">Invoices</p>
        </Link>
      </div>

      {/* Outstanding invoices */}
      {outstandingInvoices.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Outstanding Invoices</h2>
            <span className="text-lg font-bold text-amber-400">{formatCents(outstandingTotal)}</span>
          </div>
          <div className="space-y-2">
            {outstandingInvoices.map((inv) => {
              const overdue = inv.dueAt && inv.dueAt < now;
              return (
                <Link
                  key={inv.id}
                  href={`/client/invoices/${inv.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 hover:border-zinc-700"
                >
                  <div>
                    <span className="text-sm font-medium text-white">{inv.invoiceNumber}</span>
                    {inv.dueAt && (
                      <span className={`ml-2 text-xs ${overdue ? "text-red-400" : "text-zinc-500"}`}>
                        {overdue ? "Overdue — " : "Due "}
                        {formatDate(inv.dueAt)}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-white">{formatCents(inv.totalCents)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming jobs */}
      {upcomingJobs.length > 0 && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-white">Upcoming Jobs</h2>
          <div className="space-y-2">
            {upcomingJobs.map((job) => (
              <Link
                key={job.id}
                href={`/client/jobs/${job.id}`}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 hover:border-zinc-700"
              >
                <span className="text-sm font-medium text-white">{job.site.name}</span>
                <span className="text-xs text-zinc-500">{formatDate(job.scheduledStart)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
