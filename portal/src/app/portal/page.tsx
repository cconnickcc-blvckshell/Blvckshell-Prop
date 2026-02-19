import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function PortalPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  const role = session.user.role;
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
