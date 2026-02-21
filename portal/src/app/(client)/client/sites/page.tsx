import { requireClient } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function ClientSitesPage() {
  const user = await requireClient();

  const sites = await prisma.site.findMany({
    where: { clientOrganizationId: user.clientOrganizationId! },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      address: true,
      _count: { select: { jobs: true } },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Sites
      </h1>
      <p className="mt-1 text-zinc-400">
        Your locations. Job history is available from the Job history page.
      </p>
      <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/50 shadow-xl">
        {sites.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            No sites yet.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {sites.map((site) => (
              <li key={site.id} className="p-4 sm:p-5">
                <p className="font-medium text-white">{site.name}</p>
                <p className="mt-0.5 text-sm text-zinc-400">{site.address}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {site._count.jobs} job(s)
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
