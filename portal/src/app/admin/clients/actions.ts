"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

export async function createClient(formData: FormData) {
  await requireAdmin();
  const name = formData.get("name") as string;
  const primaryContactName = formData.get("primaryContactName") as string;
  const primaryContactEmail = formData.get("primaryContactEmail") as string;
  const primaryContactPhone = formData.get("primaryContactPhone") as string;
  const notes = (formData.get("notes") as string) || null;
  if (!name?.trim() || !primaryContactName?.trim() || !primaryContactEmail?.trim() || !primaryContactPhone?.trim()) {
    return { error: "Name, contact name, email, and phone are required." };
  }
  await prisma.clientOrganization.create({
    data: {
      name: name.trim(),
      primaryContactName: primaryContactName.trim(),
      primaryContactEmail: primaryContactEmail.trim(),
      primaryContactPhone: primaryContactPhone.trim(),
      notes: notes?.trim() || null,
    },
  });
  revalidatePath("/admin/clients");
  return { success: true };
}

export async function createSite(formData: FormData) {
  const user = await requireAdmin();
  const clientOrganizationId = formData.get("clientOrganizationId") as string;
  const name = formData.get("name") as string;
  const address = formData.get("address") as string;
  const accessInstructions = (formData.get("accessInstructions") as string) || null;
  const serviceWindow = (formData.get("serviceWindow") as string) || null;
  const estimatedDurationMinutes = formData.get("estimatedDurationMinutes")
    ? parseInt(formData.get("estimatedDurationMinutes") as string, 10)
    : null;
  const requiredPhotoCount = formData.get("requiredPhotoCount")
    ? parseInt(formData.get("requiredPhotoCount") as string, 10)
    : 4;
  const suppliesProvidedBy = (formData.get("suppliesProvidedBy") as "COMPANY" | "CLIENT" | "MIXED") || "COMPANY";
  const doNotEnterUnits = formData.get("doNotEnterUnits") === "on" || formData.get("doNotEnterUnits") === "true";
  if (!clientOrganizationId || !name?.trim() || !address?.trim()) {
    return { error: "Client, site name, and address are required." };
  }
  await prisma.$transaction(async (tx) => {
    const site = await tx.site.create({
      data: {
        clientOrganizationId,
        name: name.trim(),
        address: address.trim(),
        accessInstructions: accessInstructions?.trim() || null,
        serviceWindow: serviceWindow?.trim() || null,
        estimatedDurationMinutes,
        requiredPhotoCount: Number.isNaN(requiredPhotoCount) ? 4 : requiredPhotoCount,
        suppliesProvidedBy,
        doNotEnterUnits,
      },
    });

    // Audit log: Site creation
    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        actorWorkerId: user.workerId ?? null,
        actorWorkforceAccountId: user.workforceAccountId ?? null,
        entityType: "Site",
        entityId: site.id,
        fromState: null,
        toState: "CREATED",
        metadata: {
          action: "create",
          clientOrganizationId,
          name: name.trim(),
          address: address.trim(),
          createdFields: {
            name: name.trim(),
            address: address.trim(),
            hasAccessInstructions: accessInstructions !== null,
            hasServiceWindow: serviceWindow !== null,
            estimatedDurationMinutes,
            requiredPhotoCount: Number.isNaN(requiredPhotoCount) ? 4 : requiredPhotoCount,
            suppliesProvidedBy,
            doNotEnterUnits,
          },
        },
      },
    });
  });
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientOrganizationId}`);
  return { success: true };
}
