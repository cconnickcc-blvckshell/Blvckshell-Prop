import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueNotification } from "@/server/actions/notification-actions";

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

    const signup = await prisma.clientSignupRequest.create({
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

    await queueNotification({
      channel: "EMAIL",
      templateKey: "new_client_signup",
      recipient: "admin@blvckshell.com",
      payload: {
        companyName,
        contactName,
        contactEmail,
        signupId: signup.id,
      },
      relatedEntityType: "ClientSignupRequest",
      relatedEntityId: signup.id,
    }).catch(() => {});

    return NextResponse.json({ ok: true, signupId: signup.id });
  } catch (err) {
    console.error("Client signup error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
