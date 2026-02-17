import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await requireWorker();

  // Get user and worker details
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      worker: {
        include: {
          workforceAccount: {
            select: {
              displayName: true,
              type: true,
            },
          },
        },
      },
    },
  });

  if (!userData) {
    return <div>User not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Your account information</p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="mt-1 text-gray-900">{userData.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <p className="mt-1 text-gray-900">{userData.email}</p>
            </div>
            {userData.phone && (
              <div>
                <label className="text-sm font-medium text-gray-600">Phone</label>
                <p className="mt-1 text-gray-900">{userData.phone}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-600">Role</label>
              <p className="mt-1 text-gray-900">
                {userData.role.replace(/_/g, " ")}
              </p>
            </div>
            {userData.worker && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Workforce Account
                  </label>
                  <p className="mt-1 text-gray-900">
                    {userData.worker.workforceAccount.displayName} (
                    {userData.worker.workforceAccount.type})
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Photo ID on File
                  </label>
                  <p className="mt-1 text-gray-900">
                    {userData.worker.hasPhotoIdOnFile ? "Yes" : "No"}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
