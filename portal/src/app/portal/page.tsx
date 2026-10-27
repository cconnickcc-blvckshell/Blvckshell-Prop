import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/guards/rbac";

export default async function PortalPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const role = user.role;
  if (role === "ADMIN") {
    redirect("/admin/jobs");
  }
  if (
    role === "VENDOR_WORKER" ||
    role === "INTERNAL_WORKER" ||
    role === "VENDOR_OWNER"
  ) {
    redirect("/jobs");
  }
  redirect("/");
}
