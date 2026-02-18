"use client";

import { motion } from "framer-motion";
import { motionConfig } from "@/lib/animations";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={motionConfig.pageTransition.initial}
      animate={motionConfig.pageTransition.animate}
      exit={motionConfig.pageTransition.exit}
      transition={motionConfig.pageTransition.transition}
    >
      {children}
    </motion.div>
  );
}
