import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "BLVCKSHELL privacy practices. How we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-zinc-500">Last updated: February 25, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-zinc-300">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">1. Information We Collect</h2>
            <p>BLVCKSHELL Facilities Services (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) collects the following information in the course of providing workforce operations services:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-400">
              <li><strong className="text-zinc-300">Account information:</strong> Name, email address, phone number, role, and organization affiliation.</li>
              <li><strong className="text-zinc-300">Job data:</strong> Scheduled dates, completion records, checklist responses, and timestamps.</li>
              <li><strong className="text-zinc-300">Evidence photos:</strong> Images captured during job completion, with automatic redaction of sensitive content before upload.</li>
              <li><strong className="text-zinc-300">Financial data:</strong> Invoice amounts, payout amounts, and payment references. We do not store credit card numbers — payment processing is handled by Stripe.</li>
              <li><strong className="text-zinc-300">Compliance documents:</strong> Certificates of Insurance (COI), WSIB clearance certificates, and HST registration numbers for vendor/contractor accounts.</li>
              <li><strong className="text-zinc-300">Usage data:</strong> Login timestamps, check-in/check-out times, and audit trail of actions taken within the portal.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">2. How We Use Your Information</h2>
            <ul className="list-disc space-y-1 pl-6 text-zinc-400">
              <li>To operate the workforce management portal and assign jobs.</li>
              <li>To process invoices, payouts, and financial transactions.</li>
              <li>To track compliance with insurance and safety requirements.</li>
              <li>To send operational notifications (job reminders, approval updates) via email and SMS.</li>
              <li>To maintain audit trails for accountability and dispute resolution.</li>
              <li>To improve our services and platform security.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">3. Data Sharing</h2>
            <p>We do not sell your personal information. We share data only with:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-400">
              <li><strong className="text-zinc-300">Service providers:</strong> Supabase (database hosting), Vercel (application hosting), Stripe (payment processing), SendGrid (email), Twilio (SMS).</li>
              <li><strong className="text-zinc-300">Clients:</strong> Property managers receive job completion records, evidence photos, and invoice data for sites they manage.</li>
              <li><strong className="text-zinc-300">Legal requirements:</strong> We may disclose information if required by law or to protect our legal rights.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">4. Data Security</h2>
            <p>We implement security measures including:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-400">
              <li>Encrypted data transmission (HTTPS/TLS).</li>
              <li>Bcrypt password hashing — we never store plaintext passwords.</li>
              <li>Role-based access control (RBAC) limiting data access by user role.</li>
              <li>Evidence photo redaction enforced before upload — unredacted photos are never transmitted to our servers.</li>
              <li>Audit logging of all state changes and administrative actions.</li>
              <li>Security headers (HSTS, X-Frame-Options, Content-Type-Options).</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">5. Cookies</h2>
            <p>We use essential cookies for authentication (session management via NextAuth.js JWT tokens). We do not use tracking or advertising cookies. Functional cookies may be used to remember your preferences (e.g., cookie consent choice).</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">6. Data Retention</h2>
            <p>We retain account and job data for the duration of our business relationship plus 7 years for financial and compliance records, as required by Canadian tax and employment regulations. Evidence photos follow the retention schedule in our Data Retention Policy.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">7. Your Rights</h2>
            <p>Under applicable Canadian privacy legislation (PIPEDA), you have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-zinc-400">
              <li>Access your personal information held by us.</li>
              <li>Request correction of inaccurate information.</li>
              <li>Withdraw consent for non-essential communications.</li>
              <li>Request deletion of your account (subject to legal retention requirements).</li>
            </ul>
            <p className="mt-2">To exercise these rights, contact us at <a href="mailto:privacy@blvckshell.com" className="text-emerald-400 hover:text-emerald-300">privacy@blvckshell.com</a>.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-white">8. Contact</h2>
            <p>For privacy inquiries or complaints:</p>
            <p className="mt-2 text-zinc-400">
              BLVCKSHELL Facilities Services<br />
              Email: <a href="mailto:privacy@blvckshell.com" className="text-emerald-400">privacy@blvckshell.com</a><br />
              Ontario, Canada
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
