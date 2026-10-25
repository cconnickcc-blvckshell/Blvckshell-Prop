import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadSchema } from "@/lib/lead-schema";
import { getOperationsNotificationEmail } from "@/lib/operations-notifications";
import { logError, logWarn } from "@/lib/logger";

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

    const structuredMessage = [
      data.message?.trim(),
      data.serviceInterest ? `Service interest: ${data.serviceInterest}` : null,
      data.city ? `City: ${data.city}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const recipient = getOperationsNotificationEmail();

    const lead = await prisma.$transaction(async (tx) => {
      const created = await tx.lead.create({
        data: {
          name: data.name,
          company: data.company ?? null,
          phone: data.phone ?? null,
          email: data.email,
          propertyType: data.propertyType ?? null,
          sitesCount: data.sitesCount ?? null,
          preferredContact: data.preferredContact ?? null,
          buildingAddress: data.city ?? null,
          message: structuredMessage || null,
          sourcePage: data.sourcePage ?? null,
        },
      });

      if (recipient) {
        await tx.notificationOutbox.create({
          data: {
            channel: "EMAIL",
            templateKey: "new_lead",
            recipient,
            payload: {
              name: created.name,
              email: created.email,
              phone: created.phone,
              company: data.company,
              sourcePage: created.sourcePage,
              serviceInterest: data.serviceInterest,
              leadId: created.id,
            },
            relatedEntityType: "Lead",
            relatedEntityId: created.id,
            status: "PENDING",
          },
        });
      }

      return created;
    });

    if (!recipient) {
      logWarn("Lead persisted without notification recipient", {
        where: "POST /api/lead",
        entityType: "Lead",
        entityId: lead.id,
        metadata: { hint: "Set OPERATIONS_NOTIFICATION_EMAIL and monitor /admin/leads" },
      });
    }

    return NextResponse.json({
      ok: true,
      notificationQueued: Boolean(recipient),
    });
  } catch (e) {
    logError(e, { where: "POST /api/lead" });
    return NextResponse.json(
      { error: "Failed to submit. Please try again." },
      { status: 500 }
    );
  }
}
