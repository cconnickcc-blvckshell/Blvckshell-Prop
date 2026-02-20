"use server";

import { revalidatePath } from "next/cache";
import * as bcrypt from "bcryptjs";
import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";

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
  // First user (owner for vendor, worker for internal)
  const userName = (formData.get("userName") as string)?.trim();
  const userEmail = (formData.get("userEmail") as string)?.trim();
  const userPassword = formData.get("userPassword") as string;
  const userPhone = (formData.get("userPhone") as string)?.trim() || null;

  if (!type || !displayName || !primaryContactName || !primaryContactEmail || !primaryContactPhone) {
    return { error: "Type, display name, and primary contact (name, email, phone) are required." };
  }
  if (!userName || !userEmail || !userPassword || userPassword.length < 8) {
    return { error: "First user name, email, and password (min 8 chars) are required." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
  if (existingUser) return { error: "A user with this email already exists." };

  const passwordHash = bcrypt.hashSync(userPassword, 10);

  const account = await prisma.$transaction(async (tx) => {
    const account = await tx.workforceAccount.create({
      data: {
        type,
        displayName,
        legalName: type === "VENDOR" ? legalName ?? displayName : null,
        primaryContactName,
        primaryContactEmail,
        primaryContactPhone,
        hstNumber: type === "VENDOR" ? hstNumber : null,
        wsibAccountNumber: type === "VENDOR" ? wsibAccountNumber : null,
      },
    });

    // Audit log: WorkforceAccount creation
    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        actorWorkerId: user.workerId ?? null,
        actorWorkforceAccountId: user.workforceAccountId ?? null,
        entityType: "WorkforceAccount",
        entityId: account.id,
        fromState: null,
        toState: "CREATED",
        metadata: {
          action: "create",
          type,
          displayName,
          createdFields: {
            type,
            displayName,
            legalName: type === "VENDOR" ? legalName ?? displayName : null,
            primaryContactName,
            primaryContactEmail,
            primaryContactPhone,
            hasHstNumber: type === "VENDOR" && hstNumber !== null,
            hasWsibNumber: type === "VENDOR" && wsibAccountNumber !== null,
          },
        },
      },
    });

    return account;
  });

  const role = type === "VENDOR" ? "VENDOR_OWNER" : "INTERNAL_WORKER";
  const createdUser = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: userEmail,
        passwordHash,
        role,
        workforceAccountId: account.id,
        name: userName,
        phone: userPhone,
      },
    });

    // Audit log: User creation
    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        actorWorkerId: user.workerId ?? null,
        actorWorkforceAccountId: user.workforceAccountId ?? null,
        entityType: "User",
        entityId: createdUser.id,
        fromState: null,
        toState: "CREATED",
        metadata: {
          action: "create",
          role,
          email: userEmail,
          workforceAccountId: account.id,
        },
      },
    });

    return createdUser;
  });

  if (type === "INTERNAL") {
    await prisma.$transaction(async (tx) => {
      const worker = await tx.worker.create({
        data: {
          userId: createdUser.id,
          workforceAccountId: account.id,
        },
      });

      // Audit log: Worker creation
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

  revalidatePath("/admin/workforce");
  revalidatePath(`/admin/workforce/${account.id}`);
  return { success: true, accountId: account.id };
}
