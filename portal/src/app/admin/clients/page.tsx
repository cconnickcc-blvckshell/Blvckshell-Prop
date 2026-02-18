import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminClientsPage() {
  await requireAdmin();

  const clients = await prisma.clientOrganization.findMany({
    include: {
      _count: { select: { sites: true } },
      sites: { where: { isActive: true }, select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Locations</h1>
          <p className="mt-1 text-zinc-400">Client organizations and sites</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Add client
        </Link>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800 hidden md:table">
            <thead className="bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-400">Sites</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link href={`/admin/clients/${client.id}`} className="font-medium text-white hover:text-emerald-400">
                      {client.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">
                    {client.primaryContactName}
                    <br />
                    <span className="text-zinc-500">{client.primaryContactEmail}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-300">{client._count.sites}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link href={`/admin/clients/${client.id}`} className="font-medium text-emerald-400 hover:text-emerald-300">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="divide-y divide-zinc-800 md:hidden">
            {clients.map((client) => (
              <div key={client.id} className="flex flex-col gap-2 px-4 py-4">
                <Link href={`/admin/clients/${client.id}`} className="font-medium text-white hover:text-emerald-400">
                  {client.name}
                </Link>
                <p className="text-sm text-zinc-400">{client.primaryContactName}</p>
                <p className="text-xs text-zinc-500">{client.primaryContactEmail}</p>
                <p className="text-sm text-zinc-400">{client._count.sites} site(s)</p>
                <Link href={`/admin/clients/${client.id}`} className="text-sm font-medium text-zinc-300 hover:text-white">
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
        {clients.length === 0 && (
          <div className="p-8 text-center text-sm text-zinc-500">
            No clients yet.{" "}
            <Link href="/admin/clients/new" className="text-emerald-400 hover:text-emerald-300">
              Add your first client
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
