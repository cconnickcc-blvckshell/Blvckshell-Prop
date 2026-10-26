import { escapeHtml } from "@/lib/html-escape";

function wrap(body: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #09090b; border-radius: 12px; padding: 32px; color: #fafafa;">
        <h1 style="font-size: 18px; font-weight: 700; margin: 0 0 16px 0; color: #fff;">BLVCKSHELL</h1>
        ${body}
        <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;" />
        <p style="font-size: 11px; color: #71717a; margin: 0;">BLVCKSHELL Facilities Services · This is an automated notification.</p>
      </div>
    </div>
  `;
}

function subjectPart(value: unknown): string {
  return String(value ?? "").replace(/[\r\n]/g, " ").slice(0, 120);
}

export function getEmailSubject(templateKey: string, payload: Record<string, unknown>): string {
  switch (templateKey) {
    case "invoice_sent":
      return `Invoice ready — ${subjectPart(payload.clientName) || "BLVCKSHELL"}`;
    case "payment_received":
      return `Payment confirmed — ${subjectPart(payload.clientName) || "BLVCKSHELL"}`;
    case "job_approved":
      return `Job approved — ${subjectPart(payload.siteName) || "BLVCKSHELL"}`;
    case "job_rejected":
      return `Job needs resubmission — ${subjectPart(payload.siteName) || "BLVCKSHELL"}`;
    case "job_reminder":
      return `Upcoming job reminder — ${subjectPart(payload.siteName) || "BLVCKSHELL"}`;
    case "application_approved":
      return "Welcome to BLVCKSHELL";
    case "application_rejected":
      return "BLVCKSHELL Application Update";
    case "client_approved":
      return `Welcome to BLVCKSHELL — ${subjectPart(payload.companyName) || "Client Portal"}`;
    case "new_lead":
      return `New website lead — ${subjectPart(payload.name) || "BLVCKSHELL"}`;
    case "new_worker_application":
      return `New worker application — ${subjectPart(payload.applicantName) || "BLVCKSHELL"}`;
    case "new_client_signup":
      return `New client signup request — ${subjectPart(payload.companyName) || "BLVCKSHELL"}`;
    default:
      return "BLVCKSHELL Notification";
  }
}

export function getEmailHtml(templateKey: string, payload: Record<string, unknown>): string {
  const p = (key: string) => escapeHtml(payload[key]);

  switch (templateKey) {
    case "invoice_sent":
      return wrap(`<p style="color: #a1a1aa; margin: 0;">Your invoice is ready for review.</p><p style="color: #fff; font-size: 16px; margin: 12px 0;">Please log in to the portal to view and pay your invoice.</p>`);
    case "payment_received":
      return wrap(`<p style="color: #a1a1aa; margin: 0;">Payment received — thank you!</p><p style="color: #34d399; font-size: 20px; font-weight: 700; margin: 12px 0;">$${((payload.amountCents as number ?? 0) / 100).toFixed(2)}</p>`);
    case "job_approved":
      return wrap(`<p style="color: #a1a1aa; margin: 0;">Your job completion has been approved.</p><p style="color: #fff; margin: 12px 0;">${p("siteName")}</p>`);
    case "job_rejected":
      return wrap(`<p style="color: #fbbf24; margin: 0;">Your job completion needs resubmission.</p><p style="color: #fff; margin: 12px 0;">${p("siteName")}</p><p style="color: #a1a1aa;">${p("reason")}</p>`);
    case "job_reminder":
      return wrap(`<p style="color: #a1a1aa; margin: 0;">You have an upcoming job.</p><p style="color: #fff; font-size: 16px; margin: 12px 0;">${p("siteName")} at ${p("time")}</p>`);
    case "application_approved":
      return wrap(`
        <p style="color:#34d399;font-size:20px;font-weight:700;margin:0 0 12px 0;">Welcome to BLVCKSHELL</p>
        <p style="color:#a1a1aa;">Your application has been approved. Set your password using the secure link below (expires in 72 hours).</p>
        <p style="margin:16px 0;"><a href="${escapeHtml(payload.activationUrl)}" style="color:#34d399;font-weight:600;">Activate your account</a></p>
        <p style="color:#71717a;font-size:12px;">If the link does not work, copy and paste: ${escapeHtml(payload.activationUrl)}</p>
      `);
    case "application_rejected":
      return wrap(`
        <p style="color:#a1a1aa;">Thank you for your interest in BLVCKSHELL.</p>
        <p style="color:#fff;margin:12px 0;">After reviewing your application, we're unable to move forward at this time.</p>
        ${payload.reason ? `<p style="color:#a1a1aa;">${p("reason")}</p>` : ""}
        <p style="color:#71717a;font-size:12px;margin-top:16px;">You're welcome to reapply in the future.</p>
      `);
    case "client_approved":
      return wrap(`
        <p style="color:#34d399;font-size:20px;font-weight:700;margin:0 0 12px 0;">Welcome to BLVCKSHELL</p>
        <p style="color:#a1a1aa;">Your client portal account for <strong style="color:#fff;">${p("companyName")}</strong> is ready.</p>
        <p style="margin:16px 0;"><a href="${escapeHtml(payload.activationUrl)}" style="color:#34d399;font-weight:600;">Activate your account</a></p>
        <p style="color:#71717a;font-size:12px;">Link expires in 72 hours.</p>
      `);
    case "new_lead":
      return wrap(`
        <p style="color:#d4af37;font-size:18px;font-weight:700;margin:0 0 12px 0;">New website lead</p>
        <p style="color:#fff;margin:8px 0;"><strong>${p("name")}</strong> &lt;${p("email")}&gt;</p>
        ${payload.phone ? `<p style="color:#a1a1aa;">Phone: ${p("phone")}</p>` : ""}
        ${payload.company ? `<p style="color:#a1a1aa;">Company: ${p("company")}</p>` : ""}
        ${payload.serviceInterest ? `<p style="color:#a1a1aa;">Service: ${p("serviceInterest")}</p>` : ""}
        ${payload.sourcePage ? `<p style="color:#71717a;font-size:12px;">Source: ${p("sourcePage")}</p>` : ""}
        <p style="color:#71717a;font-size:12px;margin-top:16px;">Lead ID: ${p("leadId")}. Review in Admin → Leads.</p>
      `);
    case "new_worker_application":
      return wrap(`
        <p style="color:#d4af37;font-size:18px;font-weight:700;margin:0 0 12px 0;">New worker application</p>
        <p style="color:#fff;">${p("applicantName")} (${p("applicationType")}) — ${p("city")}</p>
        <p style="color:#71717a;font-size:12px;">Application ID: ${p("applicationId")}. Review in Admin → Applications.</p>
      `);
    case "new_client_signup":
      return wrap(`
        <p style="color:#d4af37;font-size:18px;font-weight:700;margin:0 0 12px 0;">New client signup request</p>
        <p style="color:#fff;">${p("companyName")} — ${p("contactName")}</p>
        <p style="color:#a1a1aa;">${p("contactEmail")}</p>
        <p style="color:#71717a;font-size:12px;">Signup ID: ${p("signupId")}. Review in Admin → Applications.</p>
      `);
    default:
      return wrap(`<p style="color: #a1a1aa;">You have a new notification. Log in to the portal for details.</p>`);
  }
}

export function getSmsBody(templateKey: string, payload: Record<string, unknown>): string {
  const site = String(payload.siteName ?? "your site");
  switch (templateKey) {
    case "job_reminder":
      return `BLVCKSHELL: Reminder — you have a job at ${site} at ${payload.time ?? "scheduled time"}. Check the portal for details.`;
    case "job_approved":
      return `BLVCKSHELL: Your job at ${site} has been approved.`;
    case "job_rejected":
      return `BLVCKSHELL: Your job at ${site} needs resubmission. Check the portal for details.`;
    case "application_approved":
      return `BLVCKSHELL: Welcome ${payload.name}! Your application is approved. Check your email for a secure account activation link. Reply STOP to opt out.`;
    case "application_rejected":
      return `BLVCKSHELL: Thank you for applying. We're unable to proceed at this time. You're welcome to reapply in the future.`;
    default:
      return "BLVCKSHELL: You have a new notification. Check the portal for details.";
  }
}
