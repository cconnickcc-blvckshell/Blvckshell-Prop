"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PaymentRail, Prisma } from "@prisma/client";

/**
 * Record a payment against an invoice. Provider-agnostic: works for Stripe, SparcPay, EFT, etc.
 * Blvckshell is the system of record; payment providers are settlement rails only.
 */
export async function recordPayment(input: {
  invoiceId: string;
  provider: PaymentRail;
  amountCents: number;
  providerRef?: string;
  metadata?: Record<string, unknown>;
}) {
  const user = await requireAdmin();

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    select: { id: true, clientId: true, status: true, totalCents: true },
  });

  if (!invoice) {
    return { success: false, error: "Invoice not found" };
  }
  if (invoice.status === "Draft") {
    return { success: false, error: "Cannot record payment against a draft invoice. Send the invoice first." };
  }
  if (input.amountCents <= 0) {
    return { success: false, error: "Payment amount must be positive" };
  }

  try {
    const payment = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId: input.invoiceId,
          clientId: invoice.clientId,
          provider: input.provider,
          providerRef: input.providerRef,
          amountCents: input.amountCents,
          status: "PENDING",
          metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorWorkerId: user.workerId ?? null,
          actorWorkforceAccountId: user.workforceAccountId ?? null,
          entityType: "Payment",
          entityId: payment.id,
          fromState: null,
          toState: "PENDING",
          metadata: {
            invoiceId: input.invoiceId,
            provider: input.provider,
            amountCents: input.amountCents,
            providerRef: input.providerRef,
          },
        },
      });

      return payment;
    });

    revalidatePath(`/admin/invoices/${input.invoiceId}`);
    return { success: true, paymentId: payment.id };
  } catch (e) {
    console.error("recordPayment:", e);
    return { success: false, error: "Failed to record payment" };
  }
}

/**
 * Mark a payment as settled (funds received/confirmed).
 * If total settled payments >= invoice total, auto-transition invoice to Paid.
 */
export async function settlePayment(paymentId: string, providerRef?: string) {
  const user = await requireAdmin();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, invoiceId: true, status: true, amountCents: true },
  });

  if (!payment) {
    return { success: false, error: "Payment not found" };
  }
  if (payment.status !== "PENDING") {
    return { success: false, error: `Payment is ${payment.status}, not PENDING` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: "SETTLED",
          settledAt: new Date(),
          ...(providerRef ? { providerRef } : {}),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          actorWorkerId: user.workerId ?? null,
          actorWorkforceAccountId: user.workforceAccountId ?? null,
          entityType: "Payment",
          entityId: paymentId,
          fromState: "PENDING",
          toState: "SETTLED",
          metadata: { invoiceId: payment.invoiceId, providerRef },
        },
      });

      // Check if total settled payments cover the invoice
      const invoice = await tx.invoice.findUnique({
        where: { id: payment.invoiceId },
        select: { totalCents: true, status: true },
      });
      if (invoice && invoice.status === "Sent") {
        const settledPayments = await tx.payment.aggregate({
          where: { invoiceId: payment.invoiceId, status: "SETTLED" },
          _sum: { amountCents: true },
        });
        const totalSettled = settledPayments._sum.amountCents ?? 0;
        if (totalSettled >= invoice.totalCents) {
          await tx.invoice.update({
            where: { id: payment.invoiceId },
            data: { status: "Paid" },
          });
          await tx.job.updateMany({
            where: { invoiceId: payment.invoiceId },
            data: { billableStatus: "Invoiced" },
          });
          await tx.auditLog.create({
            data: {
              actorUserId: user.id,
              entityType: "Invoice",
              entityId: payment.invoiceId,
              fromState: "Sent",
              toState: "Paid",
              metadata: { settledByPaymentId: paymentId, totalSettledCents: totalSettled },
            },
          });
        }
      }
    });

    revalidatePath(`/admin/invoices/${payment.invoiceId}`);
    return { success: true };
  } catch (e) {
    console.error("settlePayment:", e);
    return { success: false, error: "Failed to settle payment" };
  }
}

/**
 * Mark a payment as failed.
 */
export async function failPayment(paymentId: string, reason: string) {
  const user = await requireAdmin();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, invoiceId: true, status: true },
  });

  if (!payment) {
    return { success: false, error: "Payment not found" };
  }
  if (payment.status !== "PENDING") {
    return { success: false, error: `Payment is ${payment.status}, not PENDING` };
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { status: "FAILED", failedAt: new Date(), failureReason: reason },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: user.id,
        entityType: "Payment",
        entityId: paymentId,
        fromState: "PENDING",
        toState: "FAILED",
        metadata: { invoiceId: payment.invoiceId, reason },
      },
    });
  });

  revalidatePath(`/admin/invoices/${payment.invoiceId}`);
  return { success: true };
}

/**
 * List payments for an invoice.
 */
export async function listPaymentsForInvoice(invoiceId: string) {
  await requireAdmin();
  return prisma.payment.findMany({
    where: { invoiceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      provider: true,
      providerRef: true,
      amountCents: true,
      status: true,
      settledAt: true,
      failedAt: true,
      failureReason: true,
      createdAt: true,
    },
  });
}
