import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOperationsNotificationEmail } from "@/lib/operations-notifications";
import { logError } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      buildingCount,
      buildingType,
      city,
      message,
    } = body;

    if (!companyName?.trim() || !contactName?.trim() || !contactEmail?.trim() || !contactPhone?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Company name, contact name, email, and phone are required." },
        { status: 400 }
      );
    }

    const recipient = getOperationsNotificationEmail();

    const signup = await prisma.$transaction(async (tx) => {
      const created = await tx.clientSignupRequest.create({
        data: {
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim().toLowerCase(),
          contactPhone: contactPhone.trim(),
          buildingCount: buildingCount ? parseInt(String(buildingCount), 10) || null : null,
          buildingType: buildingType || null,
          city: city?.trim() || null,
          message: message?.trim() || null,
        },
      });

      if (recipient) {
        await tx.notificationOutbox.create({
          data: {
            channel: "EMAIL",
            templateKey: "new_client_signup",
            recipient,
            payload: {
              companyName: created.companyName,
              contactName: created.contactName,
              contactEmail: created.contactEmail,
              signupId: created.id,
            },
            relatedEntityType: "ClientSignupRequest",
            relatedEntityId: created.id,
            status: "PENDING",
          },
        });
      }

      return created;
    });

    return NextResponse.json({
      ok: true,
      signupId: signup.id,
      notificationQueued: Boolean(recipient),
    });
  } catch (err) {
    logError(err, { where: "POST /api/applications/client" });
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
