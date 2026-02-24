import { requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import ProfileEditor from "@/components/worker/ProfileEditor";
import { formatRole, formatClassification } from "@/lib/format";

export default async function ProfilePage() {
  const user = await requireWorker();

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      worker: {
        include: {
          workforceAccount: {
            select: {
              displayName: true,
              type: true,
              classification: true,
              complianceSuspended: true,
              complianceDocuments: {
                select: { type: true, expiresAt: true, uploadedAt: true },
                orderBy: { uploadedAt: "desc" },
              },
            },
          },
        },
      },
    },
  });

  if (!userData) {
    return <div className="p-4 text-zinc-400">User not found</div>;
  }

  const account = userData.worker?.workforceAccount;
  const now = new Date();
  const complianceDocs = account?.complianceDocuments ?? [];
  const coiDoc = complianceDocs.find((d) => d.type === "COI");
  const wsibDoc = complianceDocs.find((d) => d.type === "WSIB");

  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-lg space-y-4">
        <div>
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <p className="text-sm text-zinc-400">Your account information</p>
        </div>

        {/* Editable profile */}
        <ProfileEditor
          userId={userData.id}
          name={userData.name}
          phone={userData.phone ?? ""}
        />

        {/* Account info (read-only) */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xl">
          <h2 className="mb-3 text-sm font-semibold text-zinc-400">Account</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Email</span>
              <span className="text-zinc-200">{userData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Role</span>
              <span className="text-zinc-200">{formatRole(userData.role)}</span>
            </div>
            {account && (
              <>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Organization</span>
                  <span className="text-zinc-200">{account.displayName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Type</span>
                  <span className="text-zinc-200">{account.type} · {formatClassification(account.classification)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">Photo ID</span>
              <span className={userData.worker?.hasPhotoIdOnFile ? "text-emerald-400" : "text-amber-400"}>
                {userData.worker?.hasPhotoIdOnFile ? "On file" : "Not on file"}
              </span>
            </div>
          </div>
        </div>

        {/* Compliance status */}
        {account && account.type === "VENDOR" && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-xl">
            <h2 className="mb-3 text-sm font-semibold text-zinc-400">Compliance</h2>
            {account.complianceSuspended && (
              <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-300">
                Your account is compliance-suspended. Contact your admin.
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Certificate of Insurance</span>
                {coiDoc ? (
                  <span className={coiDoc.expiresAt && coiDoc.expiresAt < now ? "text-red-400" : "text-emerald-400"}>
                    {coiDoc.expiresAt
                      ? coiDoc.expiresAt < now
                        ? `Expired ${new Date(coiDoc.expiresAt).toLocaleDateString()}`
                        : `Valid until ${new Date(coiDoc.expiresAt).toLocaleDateString()}`
                      : "On file"}
                  </span>
                ) : (
                  <span className="text-amber-400">Not on file</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">WSIB Clearance</span>
                {wsibDoc ? (
                  <span className={wsibDoc.expiresAt && wsibDoc.expiresAt < now ? "text-red-400" : "text-emerald-400"}>
                    {wsibDoc.expiresAt
                      ? wsibDoc.expiresAt < now
                        ? `Expired ${new Date(wsibDoc.expiresAt).toLocaleDateString()}`
                        : `Valid until ${new Date(wsibDoc.expiresAt).toLocaleDateString()}`
                      : "On file"}
                  </span>
                ) : (
                  <span className="text-amber-400">Not on file</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
