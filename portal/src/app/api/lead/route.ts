import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadSchema } from "@/lib/lead-schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((e) => e.message).join("; ");
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const data = parsed.data;

    if (data.website?.trim()) {
      return NextResponse.json({ ok: true });
    }

    await prisma.lead.create({
      data: {
        name: data.name,
        company: data.company ?? null,
        role: data.role ?? null,
        phone: data.phone ?? null,
        email: data.email,
        propertyType: data.propertyType ?? null,
        sitesCount: data.sitesCount ?? null,
        message: data.message ?? null,
        sourcePage: data.sourcePage ?? null,
        preferredContact: data.preferredContact ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/lead:", e);
    return NextResponse.json(
      { error: "Failed to submit. Please try again." },
      { status: 500 }
    );
  }
}
