import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "BLVCKSHELL privacy practices. How we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-white">Privacy</h1>
      <p className="mt-4 text-zinc-400">
        BLVCKSHELL respects your privacy. This page summarizes how we collect,
        use, and protect information in connection with our website and
        services. Our practices are intended to align with applicable privacy
        laws, including PIPEDA and Ontario privacy requirements where relevant.
      </p>

      <section className="mt-10 space-y-4 text-zinc-300">
        <h2 className="text-xl font-semibold text-white">Information we collect</h2>
        <p>
          When you contact us (e.g. via the contact form), we collect the
          information you provide: name, company, role, phone, email, property
          type, number of sites, and message. We use this to respond to your
          inquiry and, with your consent where required, to provide quotes and
          services.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-zinc-300">
        <h2 className="text-xl font-semibold text-white">How we use it</h2>
        <p>
          We use contact and lead information to respond to requests, provide
          quotes, and deliver facilities services. We do not sell your
          information to third parties. We may retain information as needed for
          business and legal purposes, and in accordance with our data
          retention policy.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-zinc-300">
        <h2 className="text-xl font-semibold text-white">Security and storage</h2>
        <p>
          We store data using industry-standard practices and service providers.
          Access to personal information is limited to those who need it to
          perform their roles. If you use our workforce portal, additional
          terms and security measures apply as described in the portal and
          related documentation.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-zinc-300">
        <h2 className="text-xl font-semibold text-white">Your rights</h2>
        <p>
          You may request access to or correction of your personal information,
          or ask about our retention and deletion practices. Contact us using
          the information on our Contact page. We will respond in accordance
          with applicable law.
        </p>
      </section>

      <section className="mt-10 space-y-4 text-zinc-300">
        <h2 className="text-xl font-semibold text-white">Updates</h2>
        <p>
          We may update this page from time to time. The “Last updated” date
          below reflects the most recent change. Continued use of our website
          or services after changes constitutes acceptance of the updated
          privacy practices where permitted by law.
        </p>
      </section>

      <p className="mt-12 text-sm text-zinc-500">
        Last updated: February 2026.
      </p>
    </div>
  );
}
