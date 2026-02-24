import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards/rbac";
import WorkerNav from "@/components/worker/WorkerNav";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (
    user.role !== "VENDOR_WORKER" &&
    user.role !== "INTERNAL_WORKER" &&
    user.role !== "VENDOR_OWNER"
  ) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <WorkerNav userName={user.name ?? "User"} role={user.role} />
      <main className="pb-20">{children}</main>
    </div>
  );
}
