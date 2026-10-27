import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatClassification } from "@/lib/format";

export const metadata = { title: "Workforce" };

function jobCount(account: { workers: { _count: { assignedJobs: number } }[] }): number {
  return account.workers.reduce((sum, worker) => sum + worker._count.assignedJobs, 0);
}

function peopleLabel(account: {
  users: { id: string; name: string; role: string }[];
  workers: { isActive: boolean; user: { id: string; name: string } }[];
}): { workers: number; names: string } {
  const active = account.workers.filter((worker) => worker.isActive);
  const workerIds = new Set(account.workers.map((worker) => worker.user.id));
  const owners = account.users.filter(
    (accountUser) => accountUser.role === "VENDOR_OWNER" && !workerIds.has(accountUser.id),
  );
  const names = [
    ...active.map((worker) => worker.user.name),
    ...owners.map((owner) => `${owner.name} (owner)`),
  ];
  return { workers: active.length, names: names.join(", ") };
}

export default async function WorkforcePage() {
  await requireAdmin();

  const accounts = await prisma.workforceAccount.findMany({
    where: { isActive: true },
    include: {
      users: {
        where: { isActive: true },
        select: { id: true, name: true, role: true },
      },
      workers: {
        select: {
          isActive: true,
          user: { select: { id: true, name: true } },
          _count: { select: { assignedJobs: true } },
        },
      },
    },
    orderBy: [{ type: "asc" }, { displayName: "asc" }],
  });

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Workforce</h1>
          <p className="mt-1 text-zinc-400">Vendor and internal accounts</p>
        </div>
        <Link
          href="/admin/workforce/new"
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Add account
        </Link>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800 hidden md:table">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Workers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Jobs
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {accounts.map((account) => {
                const people = peopleLabel(account);
                return (
                <tr key={account.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/admin/workforce/${account.id}`}
                      className="font-medium text-white hover:text-emerald-400"
                    >
                      {account.displayName}
                    </Link>
                    <div className="text-xs text-zinc-500">{people.names || "No people yet"}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {account.type}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className="text-zinc-300">{formatClassification(account.classification)}</span>
                    {account.complianceSuspended && (
                      <span className="ml-2 inline-flex rounded-full border border-red-500/40 bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {account.primaryContactName}
                    <br />
                    <span className="text-zinc-500">{account.primaryContactEmail}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {people.workers}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {jobCount(account)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link
                      href={`/admin/workforce/${account.id}`}
                      className="font-medium text-emerald-400 hover:text-emerald-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          <div className="divide-y divide-zinc-800 md:hidden">
            {accounts.map((account) => {
              const people = peopleLabel(account);
              return (
              <div key={account.id} className="flex flex-col gap-2 px-4 py-4">
                <Link
                  href={`/admin/workforce/${account.id}`}
                  className="font-medium text-white hover:text-emerald-400"
                >
                  {account.displayName}
                </Link>
                <p className="text-sm text-zinc-400">{account.type}</p>
                <p className="text-sm text-zinc-300">{people.names || account.primaryContactName}</p>
                <p className="text-xs text-zinc-500">{account.primaryContactEmail}</p>
                <div className="flex gap-4 text-sm text-zinc-400">
                  <span>{people.workers} {people.workers === 1 ? "worker" : "workers"}</span>
                  <span>{jobCount(account)} {jobCount(account) === 1 ? "job" : "jobs"}</span>
                </div>
                <Link
                  href={`/admin/workforce/${account.id}`}
                  className="text-sm font-medium text-zinc-300 hover:text-white"
                >
                  View →
                </Link>
              </div>
              );
            })}
          </div>
        </div>
        {accounts.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No workforce accounts yet.{" "}
            <Link href="/admin/workforce/new" className="text-emerald-400 hover:text-emerald-300">
              Add your first account
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
