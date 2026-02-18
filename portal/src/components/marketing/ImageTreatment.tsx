"use client";

import { ReactNode } from "react";

interface ImageTreatmentProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  children?: ReactNode;
}

/**
 * Premium image treatment component
 * Applies: color grading overlay, subtle grain, vignette
 * Makes stock photos look curated and custom
 */
export default function ImageTreatment({
  src,
  alt,
  className = "",
  priority = false,
  children,
}: ImageTreatmentProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover"
        loading={priority ? "eager" : "lazy"}
      />
      {/* Color grading overlay (consistent across site) */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/30 via-transparent to-zinc-950/40" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]" />
      
      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cfilter id='noise'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4' result='noise'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Content overlay */}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}
