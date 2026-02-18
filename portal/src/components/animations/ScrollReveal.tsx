"use client";

import { motion } from "framer-motion";
import { motionConfig } from "@/lib/animations";
import { ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export default function ScrollReveal({ children, delay = 0, className }: ScrollRevealProps) {
  return (
    <motion.div
      initial={motionConfig.scrollReveal.initial}
      whileInView={motionConfig.scrollReveal.whileInView}
      viewport={motionConfig.scrollReveal.viewport}
      transition={{
        ...motionConfig.scrollReveal.transition,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
