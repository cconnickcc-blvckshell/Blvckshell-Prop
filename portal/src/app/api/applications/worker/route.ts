import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { queueNotification } from "@/server/actions/notification-actions";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const firstName = formData.get("firstName") as string | null;
    const lastName = formData.get("lastName") as string | null;
    const email = formData.get("email") as string | null;
    const phone = formData.get("phone") as string | null;
    const city = formData.get("city") as string | null;
    const province = (formData.get("province") as string) ?? "ON";
    const applicationType = formData.get("applicationType") as string | null;
    const companyName = formData.get("companyName") as string | null;
    const experienceYears = formData.get("experienceYears") as string | null;
    const experienceSummary = formData.get("experienceSummary") as string | null;
    const availableDaysRaw = formData.get("availableDays") as string | null;
    const availableShift = formData.get("availableShift") as string | null;
    const hasVehicle = formData.get("hasVehicle") === "true";
    const hasDriversLicense = formData.get("hasDriversLicense") === "true";
    const hasCOI = formData.get("hasCOI") === "true";
    const hasWSIB = formData.get("hasWSIB") === "true";
    const referencesRaw = formData.get("references") as string | null;
    const agreedToTerms = formData.get("agreedToTerms") === "true";
    const agreedToBackgroundCheck = formData.get("agreedToBackgroundCheck") === "true";

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim() || !city?.trim()) {
      return NextResponse.json(
        { ok: false, error: "First name, last name, email, phone, and city are required." },
        { status: 400 }
      );
    }

    if (!applicationType || !["INDIVIDUAL", "SUBCONTRACTOR"].includes(applicationType)) {
      return NextResponse.json(
        { ok: false, error: "Invalid application type." },
        { status: 400 }
      );
    }

    if (applicationType === "SUBCONTRACTOR" && !companyName?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Company name is required for subcontractor applications." },
        { status: 400 }
      );
    }

    if (!agreedToTerms || !agreedToBackgroundCheck) {
      return NextResponse.json(
        { ok: false, error: "You must agree to terms and consent to a background check." },
        { status: 400 }
      );
    }

    let availableDays: string[] = [];
    try {
      availableDays = availableDaysRaw ? JSON.parse(availableDaysRaw) : [];
    } catch {
      availableDays = [];
    }

    let references: unknown = null;
    try {
      references = referencesRaw ? JSON.parse(referencesRaw) : null;
    } catch {
      references = null;
    }

    const application = await prisma.workerApplication.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        province,
        applicationType: applicationType as "INDIVIDUAL" | "SUBCONTRACTOR",
        companyName: companyName?.trim() || null,
        experienceYears: experienceYears ? parseInt(experienceYears, 10) || null : null,
        experienceSummary: experienceSummary?.trim() || null,
        availableDays,
        availableShift: availableShift || null,
        hasVehicle,
        hasDriversLicense,
        hasCOI,
        hasWSIB,
        references: references as object ?? undefined,
        agreedToTerms,
        agreedToTermsAt: new Date(),
        agreedToBackgroundCheck,
      },
    });

    await queueNotification({
      channel: "EMAIL",
      templateKey: "new_worker_application",
      recipient: "admin@blvckshell.com",
      payload: {
        applicantName: `${firstName} ${lastName}`,
        applicationType,
        city,
        applicationId: application.id,
      },
      relatedEntityType: "WorkerApplication",
      relatedEntityId: application.id,
    }).catch(() => {});

    return NextResponse.json({ ok: true, applicationId: application.id });
  } catch (err) {
    console.error("Worker application error:", err);
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
