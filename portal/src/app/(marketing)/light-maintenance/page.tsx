"use client";

import Link from "next/link";
import ScrollReveal from "@/components/animations/ScrollReveal";
import ImageTreatment from "@/components/marketing/ImageTreatment";
import StaggerContainer, { StaggerItem } from "@/components/animations/StaggerContainer";

const IMAGE = "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1920&q=80";

export default function LightMaintenancePage() {
  return (
    <div className="min-h-screen">
      <section className="relative min-h-[50vh] border-b border-zinc-800">
        <ImageTreatment src={IMAGE} alt="Professional facility maintenance" priority className="absolute inset-0">
          <div className="relative z-10 flex min-h-[50vh] flex-col justify-end px-4 py-16 sm:px-6 sm:py-24">
            <div className="mx-auto w-full max-w-4xl">
              <ScrollReveal>
                <h1 className="text-headline font-bold tracking-tight text-white">Light Maintenance</h1>
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <p className="mt-4 max-w-2xl text-lg text-zinc-300">
                  Non-structural, non-permit, non-licensed work. Paint touch-ups, caulking, hardware fixes, and minor repairs—logged and tracked in our portal.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </ImageTreatment>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
        <ScrollReveal>
          <h2 className="text-headline font-semibold text-white">Hardware & Fixtures</h2>
          <StaggerContainer className="mt-4 space-y-2">
            {[
              "Door handle replacement",
              "Cabinet hardware tightening or replacement",
              "Closet hardware adjustments",
              "Window handle replacement",
              "Switch plate and cover replacement",
              "Light fixture replacement (like-for-like only)",
            ].map((item, i) => (
              <StaggerItem key={i} index={i}>
                <div className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                  <span className="text-zinc-300">{item}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="mt-8">
            <h2 className="text-headline font-semibold text-white">Paint & Surface Touch-Ups</h2>
            <StaggerContainer className="mt-4 space-y-2">
              {[
                "Wall touch-ups",
                "Baseboard repainting",
                "Stairwell repainting",
                "Door and trim touch-ups",
                "Minor surface sealing",
              ].map((item, i) => (
                <StaggerItem key={i} index={i}>
                  <div className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    <span className="text-zinc-300">{item}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="mt-8">
            <h2 className="text-headline font-semibold text-white">Wall & Finish Repairs</h2>
            <StaggerContainer className="mt-4 space-y-2">
              {[
                "Drywall patching (small holes, anchors)",
                "Minor crack filling",
                "Wood filler repairs",
                "Cosmetic surface smoothing",
              ].map((item, i) => (
                <StaggerItem key={i} index={i}>
                  <div className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    <span className="text-zinc-300">{item}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.3}>
          <div className="mt-8">
            <h2 className="text-headline font-semibold text-white">Caulking & Sealing</h2>
            <StaggerContainer className="mt-4 space-y-2">
              {[
                "Bathroom caulking",
                "Kitchen caulking",
                "Vanity and countertop sealing",
                "Baseboard gap sealing",
                "Window and trim sealing",
              ].map((item, i) => (
                <StaggerItem key={i} index={i}>
                  <div className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    <span className="text-zinc-300">{item}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <div className="mt-8">
            <h2 className="text-headline font-semibold text-white">Ventilation & Filters</h2>
            <StaggerContainer className="mt-4 space-y-2">
              {[
                "HVAC filter replacement (client-supplied or approved)",
                "HRV filter cleaning",
                "Range hood filter cleaning",
                "Vent cover removal and cleaning",
              ].map((item, i) => (
                <StaggerItem key={i} index={i}>
                  <div className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                    <span className="text-zinc-300">{item}</span>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.5}>
          <div className="mt-12 rounded-lg border border-red-500/20 bg-red-500/5 p-6">
            <h3 className="text-lg font-semibold text-white">Explicit Exclusions</h3>
            <p className="mt-4 text-sm text-zinc-400">
              Blvckshell does not provide electrical work beyond fixture replacement, plumbing work beyond visible fittings, HVAC servicing or repair, structural repairs, roofing or exterior envelope work, permit-required work, emergency response services, or licensed trade replacement.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.6}>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex justify-center rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-zinc-100 hover:shadow-lg"
            >
              Request a quote
            </Link>
            <Link
              href="/services"
              className="inline-flex justify-center rounded-lg border border-zinc-600 bg-zinc-900/50 px-8 py-3.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all duration-200 hover:border-zinc-500 hover:bg-zinc-800/50"
            >
              ← Back to services
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
