import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/notifications/process
 * Processes pending notifications from the outbox.
 * Called by a cron job (Vercel Cron or external scheduler).
 * 
 * For now, this marks notifications as SENT with a placeholder provider.
 * When SendGrid/Twilio are configured, this will dispatch to actual providers.
 */
export async function POST(req: NextRequest) {
  // Simple auth: require a bearer token matching CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await prisma.notificationOutbox.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  if (pending.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let sent = 0;
  let failed = 0;

  for (const notification of pending) {
    try {
      if (notification.channel === "EMAIL") {
        // TODO: Integrate SendGrid/Postmark here
        // For now, log and mark as sent (dry run)
        const sendgridKey = process.env.SENDGRID_API_KEY;
        if (sendgridKey) {
          // Real SendGrid integration would go here
          // await sendEmail(notification.recipient, notification.templateKey, notification.payload);
          await prisma.notificationOutbox.update({
            where: { id: notification.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              providerMessageId: `sendgrid-pending-integration`,
            },
          });
        } else {
          // No provider configured — mark as sent (dev mode)
          await prisma.notificationOutbox.update({
            where: { id: notification.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              providerMessageId: `dev-mode-${Date.now()}`,
            },
          });
        }
        sent++;
      } else if (notification.channel === "SMS") {
        // TODO: Integrate Twilio here
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        if (twilioSid) {
          // Real Twilio integration would go here
          await prisma.notificationOutbox.update({
            where: { id: notification.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              providerMessageId: `twilio-pending-integration`,
            },
          });
        } else {
          await prisma.notificationOutbox.update({
            where: { id: notification.id },
            data: {
              status: "SENT",
              sentAt: new Date(),
              providerMessageId: `dev-mode-${Date.now()}`,
            },
          });
        }
        sent++;
      }
    } catch (err) {
      console.error(`Failed to process notification ${notification.id}:`, err);
      await prisma.notificationOutbox.update({
        where: { id: notification.id },
        data: {
          status: "FAILED",
          error: err instanceof Error ? err.message : "Unknown error",
        },
      });
      failed++;
    }
  }

  return NextResponse.json({ processed: pending.length, sent, failed });
}
