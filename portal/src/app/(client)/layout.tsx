import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards/rbac";
import ClientNav from "@/components/client/ClientNav";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "CLIENT" || !user.clientOrganizationId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <ClientNav userName={user.name ?? "Client"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
