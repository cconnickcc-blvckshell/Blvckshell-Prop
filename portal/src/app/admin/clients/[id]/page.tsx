import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import AddSiteForm from "./AddSiteForm";
import ChecklistManager from "./ChecklistManager";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();

  const client = await prisma.clientOrganization.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      primaryContactName: true,
      primaryContactEmail: true,
      primaryContactPhone: true,
      notes: true,
      createdAt: true,
      sites: {
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          address: true,
          serviceWindow: true,
          estimatedDurationMinutes: true,
          requiredPhotoCount: true,
          checklistTemplates: { where: { isActive: true } },
        },
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="w-full space-y-8">
      <div>
        <Link href="/admin/clients" className="text-sm text-zinc-400 hover:text-white">
          ← Locations
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">{client.name}</h1>
        <p className="mt-1 text-zinc-400">
          {client.primaryContactName} • {client.primaryContactEmail} • {client.primaryContactPhone}
        </p>
        {client.notes && <p className="mt-2 text-sm text-zinc-500">{client.notes}</p>}
      </div>

      <section>
        <h2 className="text-lg font-semibold text-white">Sites</h2>
        <div className="mt-4 space-y-6">
          {client.sites.map((site) => (
            <div
              key={site.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <p className="font-medium text-white">{site.name}</p>
                  <p className="text-sm text-zinc-500">{site.address}</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {site.serviceWindow ?? "—"} • {site.estimatedDurationMinutes ?? "—"} min • Photos: {site.requiredPhotoCount}
                  </p>
                </div>
                <Link
                  href={`/admin/jobs?siteId=${site.id}`}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300 shrink-0"
                >
                  View jobs →
                </Link>
              </div>
              
              <ChecklistManager
                siteId={site.id}
                siteName={site.name}
                currentTemplates={site.checklistTemplates ? [site.checklistTemplates] : []}
              />
            </div>
          ))}
          {client.sites.length === 0 && (
            <p className="text-sm text-zinc-500">No sites yet. Add one below.</p>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-zinc-300 mb-3">Add site</h3>
          <AddSiteForm clientId={client.id} />
        </div>
      </section>
    </div>
  );
}
