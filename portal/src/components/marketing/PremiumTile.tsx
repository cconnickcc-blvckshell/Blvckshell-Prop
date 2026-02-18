"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";

interface PremiumTileProps {
  href: string;
  image: string;
  title: string;
  description: string;
  label: string; // e.g. "Process", "Scope", "Reporting"
  imageAlt?: string;
}

export default function PremiumTile({ href, image, title, description, label, imageAlt }: PremiumTileProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link href={href} className="group block">
      <motion.div
        className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all duration-300"
        initial="initial"
        whileHover="hover"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        variants={{
          initial: { y: 0, scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" },
          hover: {
            y: -4,
            scale: 1.01,
            boxShadow: "0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
            transition: {
              duration: 0.25,
              ease: [0.25, 0.1, 0.25, 1],
            },
          },
        }}
      >
        {/* Image background with treatment */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={image}
            alt={imageAlt || title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Image treatment overlay (consistent with ImageTreatment component) */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-950/40 via-zinc-950/10 to-zinc-950/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]" />
          {/* Subtle grain */}
          <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSBiYXNlRnJlcXVlbmN5PSIwLjkiIG51bU9jdGF2ZXM9IjQiIHJlc3VsdD0ibm9pc2UiLz48ZmVDb2xvck1hdHJpeCB0eXBlPSJzYXR1cmF0ZSIgdmFsdWVzPSIwIi8+PC9maWx0ZXI+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==')]" />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <motion.div
            initial={{ opacity: 0.7 }}
            animate={{ opacity: isHovered ? 1 : 0.7 }}
            transition={{ duration: 0.2 }}
          >
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</span>
            <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
            <p className="mt-1 text-sm text-zinc-300">{description}</p>
          </motion.div>
        </div>

        {/* Border glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-xl border border-white/0 pointer-events-none"
          animate={{
            borderColor: isHovered ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0)",
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    </Link>
  );
}
