import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards/rbac";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin/jobs" className="text-xl font-bold text-gray-900">
                BLVCKSHELL Admin
              </Link>
              <div className="flex gap-4">
                <Link
                  href="/admin/workforce"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Workforce
                </Link>
                <Link
                  href="/admin/jobs"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Jobs
                </Link>
                <Link
                  href="/admin/workorders"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Work Orders
                </Link>
                <Link
                  href="/admin/incidents"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Incidents
                </Link>
                <Link
                  href="/admin/payouts"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Payouts
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">{user.name}</span>
              <span className="rounded bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                ADMIN
              </span>
            </div>
          </div>
        </div>
      </nav>
      <main className="p-4">{children}</main>
    </div>
  );
}
