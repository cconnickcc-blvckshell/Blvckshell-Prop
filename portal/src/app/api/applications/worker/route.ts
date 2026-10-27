import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOperationsNotificationEmail } from "@/lib/operations-notifications";
import { logError } from "@/lib/logger";

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

    const recipient = getOperationsNotificationEmail();

    const application = await prisma.$transaction(async (tx) => {
      const created = await tx.workerApplication.create({
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
          references: (references as object) ?? undefined,
          agreedToTerms,
          agreedToTermsAt: new Date(),
          agreedToBackgroundCheck,
        },
      });

      if (recipient) {
        await tx.notificationOutbox.create({
          data: {
            channel: "EMAIL",
            templateKey: "new_worker_application",
            recipient,
            payload: {
              applicantName: `${firstName} ${lastName}`,
              applicationType,
              city,
              applicationId: created.id,
            },
            relatedEntityType: "WorkerApplication",
            relatedEntityId: created.id,
            status: "PENDING",
          },
        });
      }

      return created;
    });

    const [coiDocPath, wsibDocPath, resumePath] = await Promise.all([
      storeApplicationFile(formData.get("coi"), application.id, "COI"),
      storeApplicationFile(formData.get("wsib"), application.id, "WSIB"),
      storeApplicationFile(formData.get("resume"), application.id, "RESUME"),
    ]);
    if (coiDocPath || wsibDocPath || resumePath) {
      await prisma.workerApplication.update({
        where: { id: application.id },
        data: {
          ...(coiDocPath ? { coiDocPath } : {}),
          ...(wsibDocPath ? { wsibDocPath } : {}),
          ...(resumePath ? { resumePath } : {}),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      applicationId: application.id,
      notificationQueued: Boolean(recipient),
    });
  } catch (err) {
    logError(err, { where: "POST /api/applications/worker" });
    return NextResponse.json(
      { ok: false, error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

const APPLICATION_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

async function storeApplicationFile(
  entry: FormDataEntryValue | null,
  applicationId: string,
  kind: string,
): Promise<string | null> {
  if (!(entry instanceof File) || entry.size === 0) return null;
  if (!APPLICATION_FILE_TYPES.has(entry.type) || entry.size > 10 * 1024 * 1024) {
    logError(new Error(`Rejected ${kind} file`), {
      where: "application-file",
      entityId: applicationId,
    });
    return null;
  }
  try {
    const { storage, COMPLIANCE_BUCKET } = await import("@/lib/storage");
    const ext = entry.name.split(".").pop()?.toLowerCase() || "pdf";
    const storagePath = `${COMPLIANCE_BUCKET}/applications/${applicationId}/${kind}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await storage.from(COMPLIANCE_BUCKET).upload(storagePath, Buffer.from(await entry.arrayBuffer()), {
      contentType: entry.type,
      upsert: false,
    });
    if (error) {
      logError(new Error(error.message), { where: "application-file-upload", entityId: applicationId });
      return null;
    }
    return storagePath;
  } catch (err) {
    logError(err, { where: "application-file-upload", entityId: applicationId });
    return null;
  }
}
