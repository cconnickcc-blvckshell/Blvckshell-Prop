import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (session) {
    // Redirect based on role
    if (session.user.role === "ADMIN") {
      redirect("/admin/jobs");
    } else {
      redirect("/jobs");
    }
  } else {
    redirect("/login");
  }
}
