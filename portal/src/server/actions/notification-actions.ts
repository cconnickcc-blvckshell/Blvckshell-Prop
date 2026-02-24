"use server";

import { prisma } from "@/lib/prisma";
import type { NotificationChannel, Prisma } from "@prisma/client";

/**
 * Queue a notification for async delivery.
 * All business events write intent here; a background worker processes delivery.
 */
export async function queueNotification(input: {
  channel: NotificationChannel;
  templateKey: string;
  recipient: string;
  payload: Record<string, unknown>;
  relatedEntityType: string;
  relatedEntityId: string;
}) {
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

/**
 * Mark a notification as sent (called by the background delivery worker).
 */
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

/**
 * Mark a notification as failed (called by the background delivery worker).
 */
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

/**
 * Get pending notifications for processing (background worker polls this).
 */
export async function getPendingNotifications(limit: number = 50) {
  return prisma.notificationOutbox.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

/**
 * Get failed notifications for retry.
 */
export async function getFailedNotifications(limit: number = 50) {
  return prisma.notificationOutbox.findMany({
    where: { status: "FAILED" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

/**
 * Reset a failed notification to PENDING for retry.
 */
export async function retryNotification(notificationId: string) {
  return prisma.notificationOutbox.update({
    where: { id: notificationId },
    data: { status: "PENDING", error: null },
  });
}
