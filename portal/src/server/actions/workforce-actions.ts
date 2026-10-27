"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { unusablePasswordHash } from "@/lib/password-link";
import { inviteUserWithSetPasswordLink } from "@/server/actions/password-actions";
import { logError } from "@/lib/logger";

const COMPLIANCE_TYPES = ["COI", "WSIB", "AGREEMENT", "HST", "OTHER"] as const;
const CLASSIFICATIONS = ["EMPLOYEE", "CONTRACTOR"] as const;
const PAYMENT_METHODS = ["PAYROLL", "EFT", "CHEQUE"] as const;
const COMPLIANCE_FILE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function createWorkforceAccount(formData: FormData) {
  const user = await requireAdmin();
  const type = formData.get("type") as "VENDOR" | "INTERNAL";
  const displayName = (formData.get("displayName") as string)?.trim();
  const legalName = (formData.get("legalName") as string)?.trim() || null;
  const primaryContactName = (formData.get("primaryContactName") as string)?.trim();
  const primaryContactEmail = (formData.get("primaryContactEmail") as string)?.trim();
  const primaryContactPhone = (formData.get("primaryContactPhone") as string)?.trim();
  const hstNumber = (formData.get("hstNumber") as string)?.trim() || null;
  const wsibAccountNumber = (formData.get("wsibAccountNumber") as string)?.trim() || null;
  const userName = (formData.get("userName") as string)?.trim();
  const userEmail = (formData.get("userEmail") as string)?.trim().toLowerCase();
  const userPhone = (formData.get("userPhone") as string)?.trim() || null;

  if (!type || !displayName || !primaryContactName || !primaryContactEmail || !primaryContactPhone) {
    return { error: "Type, display name, and primary contact (name, email, phone) are required." };
  }
  if (!userName || !userEmail) {
    return { error: "First user name and email are required." };
  }
  if (type !== "VENDOR" && type !== "INTERNAL") {
    return { error: "Account type must be vendor or internal." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
  if (existingUser) return { error: "A user with this email already exists." };

  const classification = type === "INTERNAL" ? "EMPLOYEE" : "CONTRACTOR";
  const allowedPaymentMethod = type === "INTERNAL" ? "PAYROLL" : "EFT";

  const account = await prisma.$transaction(async (tx) => {
    const created = await tx.workforceAccount.create({
      data: {
        type,
        classification,
        allowedPaymentMethod,
        displayName,
        legalName: type === "VENDOR" ? legalName ?? displayName : null,
        primaryContactName,
        primaryContactEmail,
        primaryContactPhone,
        hstNumber: type === "VENDOR" ? hstNumber : null,
        wsibAccountNumber: type === "VENDOR" ? wsibAccountNumber : null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        actorWorkerId: user.workerId ?? null,
        actorWorkforceAccountId: user.workforceAccountId ?? null,
        entityType: "WorkforceAccount",
        entityId: created.id,
        fromState: null,
        toState: "CREATED",
        metadata: {
          action: "create",
          type,
          displayName,
          classification,
          allowedPaymentMethod,
        },
      },
    });

    return created;
  });

  const role = type === "VENDOR" ? "VENDOR_OWNER" : "INTERNAL_WORKER";
  const createdUser = await prisma.$transaction(async (tx) => {
    const row = await tx.user.create({
      data: {
        email: userEmail,
        passwordHash: unusablePasswordHash(),
        role,
        workforceAccountId: account.id,
        name: userName,
        phone: userPhone,
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        actorWorkerId: user.workerId ?? null,
        actorWorkforceAccountId: user.workforceAccountId ?? null,
        entityType: "User",
        entityId: row.id,
        fromState: null,
        toState: "CREATED",
        metadata: {
          action: "create",
          role,
          email: userEmail,
          name: userName,
          workforceAccountId: account.id,
        },
      },
    });

    return row;
  });

  if (type === "INTERNAL") {
    await prisma.$transaction(async (tx) => {
      const worker = await tx.worker.create({
        data: {
          userId: createdUser.id,
          workforceAccountId: account.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorWorkerId: user.workerId ?? null,
          actorWorkforceAccountId: user.workforceAccountId ?? null,
          entityType: "Worker",
          entityId: worker.id,
          fromState: null,
          toState: "CREATED",
          metadata: {
            action: "create",
            userId: createdUser.id,
            workforceAccountId: account.id,
          },
        },
      });
    });
  }

  let inviteSent = false;
  try {
    inviteSent = await inviteUserWithSetPasswordLink({
      userId: createdUser.id,
      email: userEmail,
      name: userName,
      phone: userPhone,
    });
  } catch (error) {
    logError(error, { where: "workforce-invite", entityId: createdUser.id });
  }

  revalidatePath("/admin/workforce");
  revalidatePath(`/admin/workforce/${account.id}`);
  revalidatePath("/admin/payroll");
  return { success: true, accountId: account.id, inviteSent };
}

export async function updateWorkforceSettings(
  accountId: string,
  input: { classification: string; allowedPaymentMethod: string },
) {
  const user = await requireAdmin();
  if (!CLASSIFICATIONS.includes(input.classification as (typeof CLASSIFICATIONS)[number])) {
    return { error: "Classification must be employee or contractor." };
  }
  if (!PAYMENT_METHODS.includes(input.allowedPaymentMethod as (typeof PAYMENT_METHODS)[number])) {
    return { error: "Payment method must be payroll, EFT, or cheque." };
  }

  const existing = await prisma.workforceAccount.findUnique({
    where: { id: accountId },
    select: { id: true, classification: true, allowedPaymentMethod: true },
  });
  if (!existing) return { error: "Account not found." };

  await prisma.workforceAccount.update({
    where: { id: accountId },
    data: {
      classification: input.classification as (typeof CLASSIFICATIONS)[number],
      allowedPaymentMethod: input.allowedPaymentMethod as (typeof PAYMENT_METHODS)[number],
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "WorkforceAccount",
      entityId: accountId,
      fromState: `${existing.classification}/${existing.allowedPaymentMethod}`,
      toState: `${input.classification}/${input.allowedPaymentMethod}`,
      metadata: { action: "update_classification" },
    },
  });

  revalidatePath("/admin/workforce");
  revalidatePath(`/admin/workforce/${accountId}`);
  revalidatePath("/admin/payroll");
  return { success: true };
}

export async function uploadComplianceDocument(formData: FormData) {
  const user = await requireAdmin();
  const workforceAccountId = String(formData.get("workforceAccountId") ?? "");
  const type = String(formData.get("type") ?? "");
  const expiresRaw = String(formData.get("expiresAt") ?? "").trim();
  const file = formData.get("file");

  if (!COMPLIANCE_TYPES.includes(type as (typeof COMPLIANCE_TYPES)[number])) {
    return { error: "Choose a document type." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF or image to upload." };
  }
  if (!COMPLIANCE_FILE_TYPES.has(file.type)) {
    return { error: "Upload a PDF, JPEG, PNG, or WebP file." };
  }
  if (file.size > 10 * 1024 * 1024) {
    return { error: "File is larger than 10MB." };
  }

  const account = await prisma.workforceAccount.findUnique({
    where: { id: workforceAccountId },
    select: { id: true, type: true },
  });
  if (!account) return { error: "Account not found." };

  let expiresAt: Date | null = null;
  if (expiresRaw) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresRaw)) {
      return { error: "Expiry must be a date." };
    }
    expiresAt = new Date(`${expiresRaw}T00:00:00.000Z`);
  }

  try {
    const { storage, COMPLIANCE_BUCKET, generateCompliancePath } = await import("@/lib/storage");
    const storagePath = generateCompliancePath(account.id, type, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await storage.from(COMPLIANCE_BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) {
      logError(new Error(uploadError.message), { where: "compliance-upload", entityId: account.id });
      return { error: "Upload failed. Check storage configuration and try again." };
    }

    const doc = await prisma.complianceDocument.create({
      data: {
        workforceAccountId: account.id,
        type: type as (typeof COMPLIANCE_TYPES)[number],
        storagePath,
        expiresAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        entityType: "ComplianceDocument",
        entityId: doc.id,
        fromState: null,
        toState: "UPLOADED",
        metadata: {
          action: "upload_compliance",
          type,
          workforceAccountId: account.id,
          expiresAt: expiresAt?.toISOString() ?? null,
        },
      },
    });
  } catch (error) {
    logError(error, { where: "compliance-upload", entityId: workforceAccountId });
    return { error: "Upload failed. Check storage configuration and try again." };
  }

  revalidatePath(`/admin/workforce/${workforceAccountId}`);
  return { success: true };
}
