"use client";

import { motion } from "framer-motion";
import { motionConfig, getStaggerDelay } from "@/lib/animations";
import { ReactNode } from "react";

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
}

export default function StaggerContainer({ children, className }: StaggerContainerProps) {
  return (
    <motion.div
      variants={motionConfig.staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, index, className }: { children: ReactNode; index: number; className?: string }) {
  return (
    <motion.div
      variants={motionConfig.staggerItem}
      {...getStaggerDelay(index)}
      className={className}
    >
      {children}
    </motion.div>
  );
}
