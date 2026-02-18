import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import NewInvoiceForm from "./NewInvoiceForm";

export default async function NewInvoicePage() {
  await requireAdmin();
  const clients = await prisma.clientOrganization.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="w-full max-w-2xl">
      <Link href="/admin/invoices" className="text-sm text-zinc-400 hover:text-white">
        ← Invoices
      </Link>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">New draft invoice</h1>
      <p className="mt-1 text-zinc-400">Select client and billing period</p>
      <NewInvoiceForm clients={clients} className="mt-6" />
    </div>
  );
}
