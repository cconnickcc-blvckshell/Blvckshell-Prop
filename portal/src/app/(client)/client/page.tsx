import { redirect } from "next/navigation";
import { requireClient } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ClientDashboardPage() {
  const user = await requireClient();

  const [siteCount, jobCount, invoiceCount] = await Promise.all([
    prisma.site.count({ where: { clientOrganizationId: user.clientOrganizationId! } }),
    prisma.job.count({
      where: {
        site: { clientOrganizationId: user.clientOrganizationId! },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.invoice.count({
      where: { clientId: user.clientOrganizationId!, status: { not: "Void" } },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Client dashboard
      </h1>
      <p className="mt-1 text-zinc-400">
        View your sites, job history, and invoices (read-only).
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
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
    </div>
  );
}
