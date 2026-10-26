import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyCronRequest,
  isEmailProviderConfigured,
  isSmsProviderConfigured,
} from "@/lib/cron-auth";
import { getEmailHtml, getEmailSubject, getSmsBody } from "@/server/notifications/templates";
import { resolveEmailPayloadForSend } from "@/server/notifications/resolve-email-payload";
import {
  markActivationInviteFailed,
  markActivationInviteSent,
} from "@/server/provisioning/application-provisioning";

/**
 * POST /api/notifications/process
 * Processes pending notifications from the outbox (cron only).
 * Requires CRON_SECRET. Never marks SENT without a configured provider.
 */
export async function POST(req: NextRequest) {
  const auth = verifyCronRequest(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const pending = await prisma.notificationOutbox.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0, sent: 0, failed: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const notification of pending) {
    try {
      if (notification.channel === "EMAIL") {
        if (!isEmailProviderConfigured()) {
          await prisma.notificationOutbox.update({
            where: { id: notification.id },
            data: {
              status: "FAILED",
              error: "EMAIL provider not configured (SENDGRID_API_KEY missing)",
            },
          });
          failed++;
          continue;
        }

        const sgMail = require("@sendgrid/mail");
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const rawPayload = notification.payload as Record<string, unknown>;
        const resolved = await resolveEmailPayloadForSend(notification.templateKey, rawPayload);
        if (!resolved.ok) {
          await prisma.notificationOutbox.update({
            where: { id: notification.id },
            data: { status: "FAILED", error: resolved.error },
          });
          if (notification.relatedEntityType && notification.relatedEntityId) {
            await markActivationInviteFailed(
              notification.relatedEntityType,
              notification.relatedEntityId
            );
          }
          failed++;
          continue;
        }

        const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? "noreply@blvckshell.com";

        await sgMail.send({
          to: notification.recipient,
          from: fromEmail,
          subject: getEmailSubject(notification.templateKey, resolved.payload),
          html: getEmailHtml(notification.templateKey, resolved.payload),
        });

        await prisma.notificationOutbox.update({
          where: { id: notification.id },
          data: { status: "SENT", sentAt: new Date(), providerMessageId: `sg-${Date.now()}` },
        });
        if (notification.relatedEntityType && notification.relatedEntityId) {
          const activationTemplates = new Set(["application_approved", "client_approved"]);
          if (activationTemplates.has(notification.templateKey)) {
            await markActivationInviteSent(
              notification.relatedEntityType,
              notification.relatedEntityId
            );
          }
        }
        sent++;
      } else if (notification.channel === "SMS") {
        if (!isSmsProviderConfigured()) {
          await prisma.notificationOutbox.update({
            where: { id: notification.id },
            data: {
              status: "FAILED",
              error: "SMS provider not configured (Twilio env missing)",
            },
          });
          failed++;
          continue;
        }

        const twilioSid = process.env.TWILIO_ACCOUNT_SID!;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN!;
        const twilioFrom = process.env.TWILIO_FROM_NUMBER!;
        const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const body = getSmsBody(notification.templateKey, notification.payload as Record<string, unknown>);

        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
          },
          body: new URLSearchParams({ To: notification.recipient, From: twilioFrom, Body: body }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message ?? "Twilio send failed");
        }

        await prisma.notificationOutbox.update({
          where: { id: notification.id },
          data: { status: "SENT", sentAt: new Date(), providerMessageId: data.sid ?? `tw-${Date.now()}` },
        });
        sent++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Failed to process notification ${notification.id}:`, message);
      await prisma.notificationOutbox.update({
        where: { id: notification.id },
        data: {
          status: "FAILED",
          error: message,
        },
      });
      if (notification.relatedEntityType && notification.relatedEntityId) {
        const activationTemplates = new Set(["application_approved", "client_approved"]);
        if (activationTemplates.has(notification.templateKey)) {
          await markActivationInviteFailed(
            notification.relatedEntityType,
            notification.relatedEntityId
          );
        }
      }
      failed++;
    }
  }

  return NextResponse.json({ processed: pending.length, sent, failed });
}
