import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getEmailSubject(templateKey: string, payload: Record<string, unknown>): string {
  switch (templateKey) {
    case "invoice_sent": return `Invoice ready — ${payload.clientName ?? "BLVCKSHELL"}`;
    case "payment_received": return `Payment confirmed — ${payload.clientName ?? "BLVCKSHELL"}`;
    case "job_approved": return `Job approved — ${payload.siteName ?? "BLVCKSHELL"}`;
    case "job_rejected": return `Job needs resubmission — ${payload.siteName ?? "BLVCKSHELL"}`;
    case "job_reminder": return `Upcoming job reminder — ${payload.siteName ?? "BLVCKSHELL"}`;
    case "application_approved": return `Welcome to BLVCKSHELL`;
    case "application_rejected": return `BLVCKSHELL Application Update`;
    case "client_approved": return `Welcome to BLVCKSHELL — ${payload.companyName ?? "Client Portal"}`;
    default: return `BLVCKSHELL Notification`;
  }
}

function getEmailHtml(templateKey: string, payload: Record<string, unknown>): string {
  const wrap = (body: string) => `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #09090b; border-radius: 12px; padding: 32px; color: #fafafa;">
        <h1 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #fff;">BLVCKSHELL</h1>
        ${body}
        <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
        <p style="font-size: 11px; color: #71717a; margin: 0;">BLVCKSHELL Facilities Services · This is an automated notification.</p>
      </div>
    </div>
  `;

  switch (templateKey) {
    case "invoice_sent":
      return wrap(`<p style="color: #a1a1aa; margin: 0;">Your invoice is ready for review.</p><p style="color: #fff; font-size: 16px; margin: 12px 0;">Please log in to the portal to view and pay your invoice.</p>`);
    case "payment_received":
      return wrap(`<p style="color: #a1a1aa; margin: 0;">Payment received — thank you!</p><p style="color: #34d399; font-size: 20px; font-weight: 700; margin: 12px 0;">$${((payload.amountCents as number ?? 0) / 100).toFixed(2)}</p>`);
    case "job_approved":
      return wrap(`<p style="color: #a1a1aa; margin: 0;">Your job completion has been approved.</p><p style="color: #fff; margin: 12px 0;">${payload.siteName ?? ""}</p>`);
    case "job_rejected":
      return wrap(`<p style="color: #fbbf24; margin: 0;">Your job completion needs resubmission.</p><p style="color: #fff; margin: 12px 0;">${payload.siteName ?? ""}</p><p style="color: #a1a1aa;">${payload.reason ?? ""}</p>`);
    case "job_reminder":
      return wrap(`<p style="color: #a1a1aa; margin: 0;">You have an upcoming job.</p><p style="color: #fff; font-size: 16px; margin: 12px 0;">${payload.siteName ?? ""} at ${payload.time ?? ""}</p>`);
    case "application_approved":
      return wrap(`
        <p style="color:#34d399;font-size:20px;font-weight:700;margin:0 0 12px 0;">Welcome to BLVCKSHELL</p>
        <p style="color:#a1a1aa;">Your application has been approved. You can now log in to the BLVCKSHELL Portal.</p>
        <p style="color:#fff;margin:12px 0;">Your temporary password: <strong style="color:#34d399;">${payload.tempPassword}</strong></p>
        <p style="color:#a1a1aa;">Log in at: <a href="${payload.portalUrl}/login" style="color:#34d399;">${payload.portalUrl}/login</a></p>
        <p style="color:#71717a;font-size:12px;margin-top:16px;">Please change your password after your first login.</p>
      `);
    case "application_rejected":
      return wrap(`
        <p style="color:#a1a1aa;">Thank you for your interest in BLVCKSHELL.</p>
        <p style="color:#fff;margin:12px 0;">After reviewing your application, we're unable to move forward at this time.</p>
        ${payload.reason ? `<p style="color:#a1a1aa;">${payload.reason}</p>` : ""}
        <p style="color:#71717a;font-size:12px;margin-top:16px;">You're welcome to reapply in the future.</p>
      `);
    case "client_approved":
      return wrap(`
        <p style="color:#34d399;font-size:20px;font-weight:700;margin:0 0 12px 0;">Welcome to BLVCKSHELL</p>
        <p style="color:#a1a1aa;">Your client portal account for <strong style="color:#fff;">${payload.companyName}</strong> is ready.</p>
        <p style="color:#fff;margin:12px 0;">Your temporary password: <strong style="color:#34d399;">${payload.tempPassword}</strong></p>
        <p style="color:#a1a1aa;">Log in at: <a href="${payload.portalUrl}/login" style="color:#34d399;">${payload.portalUrl}/login</a></p>
      `);
    default:
      return wrap(`<p style="color: #a1a1aa;">You have a new notification. Log in to the portal for details.</p>`);
  }
}

function getSmsBody(templateKey: string, payload: Record<string, unknown>): string {
  switch (templateKey) {
    case "job_reminder": return `BLVCKSHELL: Reminder — you have a job at ${payload.siteName ?? "your site"} at ${payload.time ?? "scheduled time"}. Check the portal for details.`;
    case "job_approved": return `BLVCKSHELL: Your job at ${payload.siteName ?? "the site"} has been approved.`;
    case "job_rejected": return `BLVCKSHELL: Your job at ${payload.siteName ?? "the site"} needs resubmission. Check the portal for details.`;
    case "application_approved": return `BLVCKSHELL: Welcome ${payload.name}! Your application is approved. Log in at ${payload.portalUrl}/login with your email and temporary password (check your email). Reply STOP to opt out.`;
    case "application_rejected": return `BLVCKSHELL: Thank you for applying. We're unable to proceed at this time. You're welcome to reapply in the future.`;
    default: return `BLVCKSHELL: You have a new notification. Check the portal for details.`;
  }
}

/**
 * POST /api/notifications/process
 * Processes pending notifications from the outbox.
 * Called by a cron job (Vercel Cron or external scheduler).
 *
 * Dispatches EMAIL via SendGrid and SMS via Twilio when env vars are set.
 * Gracefully degrades to dev-mode (mark as sent) when providers are not configured.
 */
export async function POST(req: NextRequest) {
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
        const sendgridKey = process.env.SENDGRID_API_KEY;
        if (sendgridKey) {
          const sgMail = require("@sendgrid/mail");
          sgMail.setApiKey(sendgridKey);

          const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? "noreply@blvckshell.com";
          const subject = getEmailSubject(notification.templateKey, notification.payload as Record<string, unknown>);
          const html = getEmailHtml(notification.templateKey, notification.payload as Record<string, unknown>);

          await sgMail.send({
            to: notification.recipient,
            from: fromEmail,
            subject,
            html,
          });

          await prisma.notificationOutbox.update({
            where: { id: notification.id },
            data: { status: "SENT", sentAt: new Date(), providerMessageId: `sg-${Date.now()}` },
          });
        } else {
          await prisma.notificationOutbox.update({
            where: { id: notification.id },
            data: { status: "SENT", sentAt: new Date(), providerMessageId: `dev-${Date.now()}` },
          });
        }
        sent++;
      } else if (notification.channel === "SMS") {
        const twilioSid = process.env.TWILIO_ACCOUNT_SID;
        const twilioToken = process.env.TWILIO_AUTH_TOKEN;
        const twilioFrom = process.env.TWILIO_FROM_NUMBER;

        if (twilioSid && twilioToken && twilioFrom) {
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

          if (res.ok) {
            await prisma.notificationOutbox.update({
              where: { id: notification.id },
              data: { status: "SENT", sentAt: new Date(), providerMessageId: data.sid ?? `tw-${Date.now()}` },
            });
          } else {
            throw new Error(data.message ?? "Twilio send failed");
          }
        } else {
          await prisma.notificationOutbox.update({
            where: { id: notification.id },
            data: { status: "SENT", sentAt: new Date(), providerMessageId: `dev-sms-${Date.now()}` },
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
