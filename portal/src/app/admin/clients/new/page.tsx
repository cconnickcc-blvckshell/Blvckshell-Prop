import { requireAdmin } from "@/server/guards/rbac";
import Link from "next/link";
import { createClient } from "../actions";
import ClientForm from "./ClientForm";

export default async function NewClientPage() {
  await requireAdmin();

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/clients" className="text-sm text-zinc-400 hover:text-white">
          ← Locations
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Add client</h1>
        <p className="mt-1 text-zinc-400">Create a new client organization (property manager / portfolio).</p>
      </div>
      <ClientForm action={createClient} />
    </div>
  );
}
