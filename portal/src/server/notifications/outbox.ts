import { prisma } from "@/lib/prisma";
import type { NotificationChannel, Prisma } from "@prisma/client";
import { assertNoPasswordInPayload } from "@/lib/password-link";

/**
 * Server-only notification outbox helpers.
 * This module is not a "use server" file, so these functions are not client-callable actions.
 * Callers are other server actions, route handlers, and the Stripe webhook, which already
 * authenticated the request before writing or reading the outbox.
 */

export async function queueNotification(input: {
  channel: NotificationChannel;
  templateKey: string;
  recipient: string;
  payload: Record<string, unknown>;
  relatedEntityType: string;
  relatedEntityId: string;
}) {
  assertNoPasswordInPayload(input.payload);
  return prisma.notificationOutbox.create({
    data: {
      channel: input.channel,
      templateKey: input.templateKey,
      recipient: input.recipient,
      payload: input.payload as Prisma.InputJsonValue,
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
      status: "PENDING",
    },
  });
}

export async function markNotificationSent(
  notificationId: string,
  providerMessageId: string
) {
  return prisma.notificationOutbox.update({
    where: { id: notificationId },
    data: {
      status: "SENT",
      providerMessageId,
      sentAt: new Date(),
    },
  });
}

export async function markNotificationFailed(
  notificationId: string,
  error: string
) {
  return prisma.notificationOutbox.update({
    where: { id: notificationId },
    data: {
      status: "FAILED",
      error,
    },
  });
}

export async function getPendingNotifications(limit: number = 50) {
  return prisma.notificationOutbox.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function getFailedNotifications(limit: number = 50) {
  return prisma.notificationOutbox.findMany({
    where: { status: "FAILED" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function retryNotification(notificationId: string) {
  return prisma.notificationOutbox.update({
    where: { id: notificationId },
    data: { status: "PENDING", error: null },
  });
}
