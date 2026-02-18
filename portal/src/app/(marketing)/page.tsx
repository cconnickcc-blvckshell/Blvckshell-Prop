"use client";

import Link from "next/link";
import ScrollReveal from "@/components/animations/ScrollReveal";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";
import PremiumTile from "@/components/marketing/PremiumTile";
import ImageTreatment from "@/components/marketing/ImageTreatment";

// Curated commercial building imagery (replace with your own)
// Using Unsplash URLs for now - replace with your curated images
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80", // Modern office building
  condo: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80", // Luxury condo lobby
  commercial: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80", // Corporate office
  maintenance: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80", // Professional facility
  evidence: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80", // Clean modern space
};

export default function HomePage() {
  return (
    <div>
      {/* Hero — premium with real image */}
      <section className="relative min-h-[70vh] border-b border-zinc-800">
        <ImageTreatment src={IMAGES.hero} alt="Modern commercial building" priority className="absolute inset-0">
          <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-4 py-24 sm:px-6 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <ScrollReveal>
                <h1 className="text-display font-bold tracking-tight text-white">
                  Facilities services that scale with your properties
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p className="mt-6 text-lg text-zinc-300 sm:text-xl">
                  BLVCKSHELL delivers consistent cleaning, light maintenance, and site
                  management for condos and commercial buildings. Quality you can measure.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                  <Link
                    href="/contact"
                    className="rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-100 hover:shadow-lg"
                  >
                    Request a walkthrough & quote
                  </Link>
                  <a
                    href="tel:+15195550100"
                    className="rounded-lg border border-zinc-600 bg-zinc-900/50 px-8 py-3.5 text-center text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-800/50 sm:hidden"
                  >
                    Call (519) 555-0100
                  </a>
                </div>
              </ScrollReveal>
            </div>
            {/* Subtle scroll indicator */}
            <ScrollReveal delay={0.4}>
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <div className="h-8 w-px bg-zinc-600 animate-pulse" />
              </div>
            </ScrollReveal>
          </div>
        </ImageTreatment>
      </section>

      {/* Built for property managers — trust strip */}
      <ScrollReveal>
        <section className="border-b border-zinc-800 bg-zinc-900/30 px-4 py-12 backdrop-blur-sm sm:px-6">
          <div className="mx-auto max-w-6xl">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Built for property managers
            </p>
            <StaggerContainer className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
              {[
                "Photo-verified visits",
                "Checklist-based service",
                "Missed-visit make-goods",
                "Incident reporting",
                "Key/FOB control",
              ].map((item, i) => (
                <StaggerItem key={item} index={i} className="text-center">
                  <p className="text-sm font-medium text-zinc-300">{item}</p>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </ScrollReveal>

      {/* 3 Core Pillars — Premium Tiles */}
      <section className="px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <h2 className="text-headline font-semibold text-white">Services</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Cleaning, light maintenance, and site support tailored to your buildings and contracts.
            </p>
          </ScrollReveal>
          <StaggerContainer className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StaggerItem index={0}>
              <PremiumTile
                href="/condo-cleaning"
                image={IMAGES.condo}
                title="Condo cleaning"
                description="Common areas, lobbies, washrooms, and shared spaces."
                label="Scope"
                imageAlt="Luxury condo lobby"
              />
            </StaggerItem>
            <StaggerItem index={1}>
              <PremiumTile
                href="/commercial-cleaning"
                image={IMAGES.commercial}
                title="Commercial cleaning"
                description="Office, retail, and mixed-use. Scheduled and on-demand."
                label="Process"
                imageAlt="Modern commercial office space"
              />
            </StaggerItem>
            <StaggerItem index={2}>
              <PremiumTile
                href="/light-maintenance"
                image={IMAGES.maintenance}
                title="Light maintenance"
                description="Minor repairs, bulb replacement, and site support."
                label="Reporting"
                imageAlt="Professional facility maintenance"
              />
            </StaggerItem>
          </StaggerContainer>
        </div>
      </section>

      {/* Proof of Operations */}
      <ScrollReveal>
        <section className="border-y border-zinc-800 bg-zinc-900/30 px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-headline font-semibold text-white">Proof & accountability</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              We don't just show up—we document. Every job is tied to clear standards and your review.
            </p>
            <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-16">
              <div>
                <StaggerContainer className="space-y-6">
                  {[
                    { icon: "✓", text: "Site-specific checklists so scope is clear and nothing is missed." },
                    { icon: "📸", text: "Photo evidence minimums per area so you see what was done." },
                    { icon: "⚡", text: "Issue escalation SLA: safety and damage reported same day." },
                    { icon: "🔄", text: "Re-clean policy: we return to fix it or you get credit." },
                  ].map((item, i) => (
                    <StaggerItem key={i} index={i} className="flex gap-4">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                      <p className="text-zinc-300">{item.text}</p>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-800">
                <ImageTreatment src={IMAGES.evidence} alt="Portal evidence example" />
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/40">
                  <div className="text-center text-zinc-400">
                    <p className="text-sm font-medium">Portal evidence example</p>
                    <p className="mt-1 text-xs">Replace with screenshot</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Who we serve */}
      <ScrollReveal>
        <section className="px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-headline font-semibold text-white">Who we serve</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Property managers, condo boards, and commercial building operators who need reliable, auditable facilities work. We launch in{" "}
              <strong className="text-white">Windsor–Essex</strong> and serve{" "}
              <strong className="text-white">Ontario-wide</strong>—multi-site portfolios welcome.
            </p>
            <StaggerContainer className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["Condo corporations", "Commercial property managers", "Multi-site portfolios"].map((item, i) => (
                <StaggerItem key={item} index={i}>
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-6 py-5 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/70">
                    <p className="font-medium text-zinc-300">{item}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </ScrollReveal>

      {/* How it works */}
      <ScrollReveal>
        <section className="border-y border-zinc-800 bg-zinc-900/30 px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-headline font-semibold text-white">How it works</h2>
            <StaggerContainer className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                { title: "Scope & quote", body: "We align on scope, checklists, and frequency. You get a clear quote and schedule." },
                { title: "Scheduled service", body: "Assigned crews complete work on schedule. Evidence and checklists are captured in our portal." },
                { title: "Review & approve", body: "You review completions and approve. Invoicing and payouts are handled in one place." },
              ].map(({ title, body }, i) => (
                <StaggerItem key={i} index={i}>
                  <div className="flex gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base font-semibold text-zinc-900">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm text-zinc-400">{body}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </ScrollReveal>

      {/* Trust & Compliance */}
      <ScrollReveal>
        <section className="border-y border-zinc-800 bg-zinc-900/30 px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-headline font-semibold text-white">Trust & compliance</h2>
            <StaggerContainer className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Insurance & compliance",
                  items: ["COI on file", "WSIB coverage", "Compliance-ready", "HST registered"],
                },
                {
                  title: "Service-level expectations",
                  items: ["Photo evidence per visit", "Site-specific checklists", "Completion reports", "Review & approve workflow"],
                },
                {
                  title: "Issue handling",
                  items: ["Safety & damage reported same day", "Incident reports logged", "Response times documented", "Escalation workflow"],
                },
                {
                  title: "Operational coverage",
                  items: ["Backup cleaner plan", "Missed-visit make-good policy", "Key/FOB control", "Multi-site coordination"],
                },
                {
                  title: "Where we operate",
                  items: ["Launch: Windsor–Essex", "Service area: Ontario-wide", "Multi-site portfolios welcome", "Site walks available"],
                },
                {
                  title: "Proof & accountability",
                  items: ["Site-specific checklists", "Photo evidence minimums", "Re-clean or credit policy", "Portal access for review"],
                },
              ].map((block, i) => (
                <StaggerItem key={i} index={i}>
                  <div>
                    <h3 className="font-semibold text-white">{block.title}</h3>
                    <ul className="mt-4 space-y-2 text-sm text-zinc-400">
                      {block.items.map((item, j) => (
                        <li key={j} className="flex gap-2">
                          <span className="text-emerald-500">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal>
        <section className="px-4 py-24 sm:px-6 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-headline font-semibold text-white">Ready to get started?</h2>
            <p className="mt-4 text-lg text-zinc-400">
              Request a quote or book a site walk. We'll respond within one business day.
            </p>
            <Link
              href="/contact"
              className="mt-10 inline-block rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-100 hover:shadow-lg"
            >
              Contact us
            </Link>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
