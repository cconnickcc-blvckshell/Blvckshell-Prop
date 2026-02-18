import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards/rbac";
import Link from "next/link";

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Only workers and vendor owners can access worker routes
  if (
    user.role !== "VENDOR_WORKER" &&
    user.role !== "INTERNAL_WORKER" &&
    user.role !== "VENDOR_OWNER"
  ) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/jobs" className="text-xl font-bold text-gray-900">
                BLVCKSHELL Portal
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/jobs"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Jobs
              </Link>
              {(user.role === "VENDOR_OWNER") && (
                <>
                  <Link
                    href="/vendor/team"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Team
                  </Link>
                  <Link
                    href="/vendor/jobs"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    Vendor Jobs
                  </Link>
                </>
              )}
              <Link
                href="/earnings"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Earnings
              </Link>
              <Link
                href="/profile"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Profile
              </Link>
              <span className="text-sm text-gray-500">{user.name}</span>
            </div>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
