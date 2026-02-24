"use server";

import { requireAdmin, requireWorker } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Create a time entry for a worker (internal employees).
 * Time entries are the basis for payroll export.
 */
export async function createTimeEntry(input: {
  workerId: string;
  jobId?: string;
  date: string;
  regularMinutes: number;
  overtimeMinutes?: number;
  rateCentsPerHour: number;
  notes?: string;
}) {
  const user = await requireAdmin();

  const worker = await prisma.worker.findUnique({
    where: { id: input.workerId },
    select: {
      id: true,
      workforceAccountId: true,
      workforceAccount: { select: { classification: true } },
    },
  });

  if (!worker) {
    return { success: false, error: "Worker not found" };
  }

  if (worker.workforceAccount.classification !== "EMPLOYEE") {
    return {
      success: false,
      error: "Time entries are only for employees. Contractors are paid via AP/payout.",
    };
  }

  const entry = await prisma.timeEntry.create({
    data: {
      workerId: input.workerId,
      workforceAccountId: worker.workforceAccountId,
      jobId: input.jobId,
      date: new Date(input.date),
      regularMinutes: input.regularMinutes,
      overtimeMinutes: input.overtimeMinutes ?? 0,
      rateCentsPerHour: input.rateCentsPerHour,
      notes: input.notes,
      status: "DRAFT",
    },
  });

  revalidatePath("/admin/payroll");
  return { success: true, entryId: entry.id };
}

/**
 * Approve time entries for payroll export (admin only).
 */
export async function approveTimeEntries(entryIds: string[]) {
  const user = await requireAdmin();

  const entries = await prisma.timeEntry.findMany({
    where: { id: { in: entryIds }, status: "SUBMITTED" },
    select: { id: true },
  });

  if (entries.length === 0) {
    return { success: false, error: "No submitted time entries found" };
  }

  await prisma.timeEntry.updateMany({
    where: { id: { in: entries.map((e) => e.id) } },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      approvedById: user.id,
    },
  });

  revalidatePath("/admin/payroll");
  return { success: true, approvedCount: entries.length };
}

/**
 * Export approved time entries for a payroll period.
 * Returns structured data ready for payroll provider import.
 */
export async function exportPayrollBatch(input: {
  periodStart: string;
  periodEnd: string;
  batchRef: string;
}) {
  const user = await requireAdmin();

  const start = new Date(input.periodStart);
  const end = new Date(input.periodEnd);

  const entries = await prisma.timeEntry.findMany({
    where: {
      status: "APPROVED",
      date: { gte: start, lte: end },
      payrollExportedAt: null,
    },
    include: {
      worker: {
        select: {
          user: { select: { name: true, email: true } },
        },
      },
      workforceAccount: { select: { displayName: true } },
    },
    orderBy: [{ workforceAccountId: "asc" }, { date: "asc" }],
  });

  if (entries.length === 0) {
    return { success: false, error: "No approved, unexported entries in this period" };
  }

  // Mark as exported
  await prisma.timeEntry.updateMany({
    where: { id: { in: entries.map((e) => e.id) } },
    data: {
      status: "EXPORTED",
      payrollExportedAt: new Date(),
      payrollBatchRef: input.batchRef,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      entityType: "PayrollExport",
      entityId: input.batchRef,
      fromState: null,
      toState: "EXPORTED",
      metadata: {
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        entryCount: entries.length,
        totalRegularMinutes: entries.reduce((sum, e) => sum + e.regularMinutes, 0),
        totalOvertimeMinutes: entries.reduce((sum, e) => sum + e.overtimeMinutes, 0),
      },
    },
  });

  const exportData = entries.map((e) => ({
    entryId: e.id,
    workerName: e.worker.user.name,
    workerEmail: e.worker.user.email,
    accountName: e.workforceAccount.displayName,
    date: e.date.toISOString().split("T")[0],
    regularMinutes: e.regularMinutes,
    overtimeMinutes: e.overtimeMinutes,
    rateCentsPerHour: e.rateCentsPerHour,
    regularPayCents: Math.round((e.regularMinutes / 60) * e.rateCentsPerHour),
    overtimePayCents: Math.round((e.overtimeMinutes / 60) * e.rateCentsPerHour * 1.5),
  }));

  revalidatePath("/admin/payroll");
  return { success: true, batchRef: input.batchRef, entries: exportData };
}

/**
 * List time entries with optional filters.
 */
export async function listTimeEntries(filters?: {
  workerId?: string;
  status?: string;
  periodStart?: string;
  periodEnd?: string;
}) {
  await requireAdmin();

  return prisma.timeEntry.findMany({
    where: {
      ...(filters?.workerId ? { workerId: filters.workerId } : {}),
      ...(filters?.status ? { status: filters.status as "DRAFT" | "SUBMITTED" | "APPROVED" | "EXPORTED" | "PAID" } : {}),
      ...(filters?.periodStart && filters?.periodEnd
        ? { date: { gte: new Date(filters.periodStart), lte: new Date(filters.periodEnd) } }
        : {}),
    },
    include: {
      worker: { select: { user: { select: { name: true } } } },
      workforceAccount: { select: { displayName: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
}
