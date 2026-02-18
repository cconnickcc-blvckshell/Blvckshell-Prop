"use client";

import { motion } from "framer-motion";
import { motionConfig } from "@/lib/animations";

interface ProcessStep {
  icon: string;
  title: string;
  description: string;
}

interface ProcessFlowProps {
  steps: ProcessStep[];
}

export default function ProcessFlow({ steps }: ProcessFlowProps) {
  return (
    <div className="relative">
      {/* Connecting line (desktop only) */}
      <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-zinc-800 via-zinc-700 to-zinc-800 sm:block" />
      
      <div className="space-y-8">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.4,
              delay: index * 0.1,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="relative flex gap-6"
          >
            {/* Icon circle */}
            <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-900/80 backdrop-blur-sm">
              <span className="text-2xl">{step.icon}</span>
            </div>
            
            {/* Content */}
            <div className="flex-1 pt-1">
              <h3 className="font-semibold text-white">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
