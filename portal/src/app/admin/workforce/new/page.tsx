import { requireAdmin } from "@/server/guards/rbac";
import Link from "next/link";
import { createWorkforceAccount } from "../actions";
import WorkforceForm from "./WorkforceForm";

export default async function NewWorkforcePage() {
  await requireAdmin();

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6">
        <Link href="/admin/workforce" className="text-sm text-zinc-400 hover:text-white">
          ← Workforce
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">Add workforce account</h1>
        <p className="mt-1 text-zinc-400">Create a new subcontractor (vendor) or internal employee account.</p>
      </div>
      <WorkforceForm action={createWorkforceAccount} />
    </div>
  );
}
