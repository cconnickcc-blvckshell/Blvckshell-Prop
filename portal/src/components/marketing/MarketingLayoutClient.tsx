"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { motionConfig } from "@/lib/animations";

export default function MarketingLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={motionConfig.pageTransition.initial}
        animate={motionConfig.pageTransition.animate}
        exit={motionConfig.pageTransition.exit}
        transition={motionConfig.pageTransition.transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
