import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/server/guards/rbac";
import { transitionJob } from "@/lib/state-machine";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAdmin();
    const result = await transitionJob(user, params.id, "CANCELLED", {
      cancelledBy: user.id,
    });
    if (result.success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error cancelling job:", error);
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
}
