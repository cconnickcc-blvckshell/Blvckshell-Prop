import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function WorkforcePage() {
  await requireAdmin();

  const accounts = await prisma.workforceAccount.findMany({
    where: { isActive: true },
    include: {
      workers: {
        where: { isActive: true },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: { workers: true, jobs: true },
      },
    },
    orderBy: [{ type: "asc" }, { displayName: "asc" }],
  });

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Workforce</h1>
        <p className="mt-1 text-zinc-400">Vendor and internal accounts</p>
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
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link
                      href={`/admin/workforce/${account.id}`}
                      className="font-medium text-white hover:text-emerald-400"
                    >
                      {account.displayName}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {account.type}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {account.primaryContactName}
                    <br />
                    <span className="text-zinc-500">{account.primaryContactEmail}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {account._count.workers}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {account._count.jobs}
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
              ))}
            </tbody>
          </table>
          <div className="divide-y divide-zinc-800 md:hidden">
            {accounts.map((account) => (
              <div key={account.id} className="flex flex-col gap-2 px-4 py-4">
                <Link
                  href={`/admin/workforce/${account.id}`}
                  className="font-medium text-white hover:text-emerald-400"
                >
                  {account.displayName}
                </Link>
                <p className="text-sm text-zinc-400">{account.type}</p>
                <p className="text-sm text-zinc-300">{account.primaryContactName}</p>
                <p className="text-xs text-zinc-500">{account.primaryContactEmail}</p>
                <div className="flex gap-4 text-sm text-zinc-400">
                  <span>{account._count.workers} workers</span>
                  <span>{account._count.jobs} jobs</span>
                </div>
                <Link
                  href={`/admin/workforce/${account.id}`}
                  className="text-sm font-medium text-zinc-300 hover:text-white"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
        {accounts.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">No workforce accounts yet.</div>
        )}
      </section>
    </div>
  );
}
