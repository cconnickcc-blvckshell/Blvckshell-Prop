"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ScrollReveal from "@/components/animations/ScrollReveal";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";
import PremiumTile from "@/components/marketing/PremiumTile";
import ImageTreatment from "@/components/marketing/ImageTreatment";
import ProcessFlow from "@/components/marketing/ProcessFlow";
import { motionConfig } from "@/lib/animations";

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
      {/* Hero — Portfolio-Ready Facility Operations */}
      <section className="relative min-h-[75vh] border-b border-zinc-800">
        <ImageTreatment src={IMAGES.hero} alt="Premium commercial building lobby" priority className="absolute inset-0">
          <div className="relative z-10 flex min-h-[75vh] flex-col items-center justify-center px-4 py-24 sm:px-6 lg:py-32">
            <div className="mx-auto max-w-4xl text-center">
              <motion.h1
                initial={motionConfig.heroReveal.initial}
                animate={motionConfig.heroReveal.animate}
                transition={motionConfig.heroReveal.animate.transition}
                className="text-display font-bold tracking-tight text-white text-balance"
              >
                Facilities Services Built Deliberately
              </motion.h1>
              <motion.p
                initial={motionConfig.heroReveal.initial}
                animate={motionConfig.heroReveal.animate}
                transition={{ delay: 0.2, ...motionConfig.heroReveal.animate.transition }}
                className="mt-4 text-lg font-medium text-zinc-300 sm:text-xl"
              >
                Structured, Accountable, Prepared from Day One
              </motion.p>
              <motion.p
                initial={motionConfig.heroReveal.initial}
                animate={motionConfig.heroReveal.animate}
                transition={{ delay: 0.35, ...motionConfig.heroReveal.animate.transition }}
                className="mt-6 text-base leading-relaxed text-zinc-400 sm:text-lg"
              >
                Checklists, photo verification, and compliance tracking designed into our operations from the start. Built for property managers who value structure over scale.
              </motion.p>
              <motion.div
                initial={motionConfig.heroReveal.initial}
                animate={motionConfig.heroReveal.animate}
                transition={{ delay: 0.45, ...motionConfig.heroReveal.animate.transition }}
                className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 max-w-2xl"
              >
                <p className="text-sm text-emerald-300">
                  <strong>New operator, built deliberately.</strong> We're starting small, onboarding carefully, and prioritizing repeatable quality over rapid growth. Our systems are designed to prevent problems before they happen.
                </p>
              </motion.div>
              <motion.div
                initial={motionConfig.heroReveal.initial}
                animate={motionConfig.heroReveal.animate}
                transition={{ delay: 0.5, ...motionConfig.heroReveal.animate.transition }}
                className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
              >
                <Link
                  href="/contact"
                  className="group rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-100 hover:shadow-xl hover:scale-[1.02]"
                >
                  Request a site evaluation
                </Link>
                <Link
                  href="/contact"
                  className="rounded-lg border border-zinc-600 bg-zinc-900/50 px-8 py-3.5 text-center text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-800/50 sm:hidden"
                >
                  Get in touch
                </Link>
              </motion.div>
            </div>
            {/* Subtle scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
              <div className="h-8 w-px bg-zinc-600 animate-pulse" />
            </motion.div>
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

      {/* How We Operationalize Quality — Process Flow */}
      <ScrollReveal>
        <section className="border-b border-zinc-800 bg-zinc-950 px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-headline font-semibold text-white">How We Operationalize Quality</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Not generic promises—a systematic flow designed from day one. Every visit is structured to follow a documented process with accountability at every step.
            </p>
            <div className="mt-12">
              <ProcessFlow
                steps={[
                  {
                    icon: "📅",
                    title: "Scheduled Visits",
                    description: "Checklist enforced. Every job tied to site-specific scope and frequency. No guesswork.",
                  },
                  {
                    icon: "📸",
                    title: "Photo Evidence Captured",
                    description: "Timestamped and labeled. Minimum evidence per area so you see what was done, when.",
                  },
                  {
                    icon: "👁️",
                    title: "Site Manager Review",
                    description: "Approval required. You review completions, evidence, and checklists before sign-off.",
                  },
                  {
                    icon: "⚡",
                    title: "Issue & Escalation",
                    description: "Automatic alerts for safety, damage, or scope gaps. Reported same day with documented response times.",
                  },
                  {
                    icon: "📋",
                    title: "Audit Trails",
                    description: "Every change logged. Complete history of visits, approvals, issues, and resolutions. Board-ready reporting.",
                  },
                ]}
              />
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Services — Solution */}
      <section className="px-4 py-20 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal>
            <h2 className="text-headline font-semibold text-white">Our Services</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Cleaning, unit turnovers, light maintenance, and facilities support. Each service is structured with checklists, evidence, and accountability built in from day one.
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
                description="Minor repairs, paint touch-ups, caulking, and site support."
                label="Reporting"
                imageAlt="Professional facility maintenance"
              />
            </StaggerItem>
          </StaggerContainer>
          <ScrollReveal delay={0.2}>
            <div className="mt-12 text-center">
              <Link
                href="/pilots"
                className="inline-block rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
              >
                View Pilot Programs →
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Proof & Accountability — Visual Evidence */}
      <ScrollReveal>
        <section className="border-y border-zinc-800 bg-zinc-900/30 px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-headline font-semibold text-white">Proof & Accountability</h2>
            <p className="mt-4 max-w-2xl text-zinc-400">
              Our operations are structured to produce proof by default. Every job is designed to be tied to clear standards and your review—this isn't added later, it's built in from the start.
            </p>
            <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-16">
              <div>
                <StaggerContainer className="space-y-6">
                  {[
                    { icon: "✓", text: "Site-specific checklists designed from day one so scope is clear and nothing is missed." },
                    { icon: "📸", text: "Photo evidence minimums per area—structured to show what was done, not added as an afterthought." },
                    { icon: "⚡", text: "Issue escalation logic: safety and damage reported same day with documented response times." },
                    { icon: "🔄", text: "Re-clean policy: we return to fix it or you get credit—accountability designed in, not reactive." },
                  ].map((item, i) => (
                    <StaggerItem key={i} index={i} className="flex gap-4">
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--accent-secondary)" }} aria-hidden />
                      <p className="text-zinc-300">{item.text}</p>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
              <div className="space-y-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
                  <ImageTreatment src={IMAGES.evidence} alt="Documented visit example — timestamped evidence and checklist sign-off" />
                </div>
                <p className="text-center text-sm text-zinc-500">
                  Every visit produces timestamped evidence and checklist sign-off. Request a sample report below.
                </p>
                <div className="flex justify-center">
                  <Link
                    href="/contact?request=sample-report"
                    className="rounded-lg border border-zinc-600 bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800"
                  >
                    Request a sample report
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* Who we serve — Target Audience */}
      <ScrollReveal>
        <section className="border-y border-zinc-800 bg-zinc-950 px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-headline font-semibold text-white">Who We Serve</h2>
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

      {/* How it works — Process Overview */}
      <ScrollReveal>
        <section className="border-y border-zinc-800 bg-zinc-900/30 px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-headline font-semibold text-white">How It Works</h2>
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

      {/* Trust & Compliance — Credibility */}
      <ScrollReveal>
        <section className="border-y border-zinc-800 bg-zinc-900/30 px-4 py-20 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-headline font-semibold text-white">Trust & Compliance</h2>
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

      {/* Final CTA — Portfolio Walkthrough */}
      <ScrollReveal>
        <section className="border-t border-zinc-800 bg-zinc-950 px-4 py-24 sm:px-6 lg:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-headline font-semibold text-white">Ready to Get Started?</h2>
            <p className="mt-4 text-lg leading-relaxed text-zinc-400">
              Get a no-obligation site evaluation. See how we run your sites with a guided tour of our portal and process.
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              We'll respond within one business day.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/contact"
                className="group rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-100 hover:shadow-xl hover:scale-[1.02]"
              >
                Request a site evaluation
              </Link>
              <Link
                href="/contact?request=sample-report"
                className="rounded-lg border border-zinc-600 bg-zinc-900/50 px-8 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-800/50"
              >
                See a sample report
              </Link>
            </div>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
