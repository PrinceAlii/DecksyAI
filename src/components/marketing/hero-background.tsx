"use client";

import { motion } from "framer-motion";

const blobTransition = {
  duration: 18,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: "easeInOut" as const,
};

const strokeTransition = {
  duration: 22,
  repeat: Infinity,
  repeatType: "mirror" as const,
  ease: "easeInOut" as const,
};

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute left-1/2 top-[-6rem] h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
      />

      <motion.div
        aria-hidden
        className="absolute left-[12%] top-[25%] h-[22rem] w-[22rem] rounded-full bg-accent/20 blur-3xl"
        initial={{ opacity: 0.25, scale: 0.8 }}
        animate={{
          opacity: [0.25, 0.4, 0.25],
          scale: [0.8, 1.05, 0.8],
          x: [0, 20, -12, 0],
          y: [0, -16, 12, 0],
        }}
        transition={blobTransition}
      />

      <motion.div
        aria-hidden
        className="absolute right-[10%] top-[35%] h-[20rem] w-[20rem] rounded-full bg-primary/15 blur-3xl"
        initial={{ opacity: 0.2, scale: 0.9 }}
        animate={{
          opacity: [0.2, 0.35, 0.2],
          scale: [0.9, 1.1, 0.9],
          x: [0, -16, 14, 0],
          y: [0, 18, -14, 0],
        }}
        transition={{ ...blobTransition, duration: 20 }}
      />

      <motion.div
        aria-hidden
        className="absolute left-[8%] top-[12%] h-48 w-48 rounded-[4rem] border border-primary/30"
        initial={{ opacity: 0, rotate: -8 }}
        animate={{ opacity: 0.6, rotate: 12 }}
        transition={strokeTransition}
      />

      <motion.div
        aria-hidden
        className="absolute right-[14%] bottom-[16%] h-44 w-44 rounded-[4rem] border border-accent/30"
        initial={{ opacity: 0, rotate: 6 }}
        animate={{ opacity: 0.5, rotate: -10 }}
        transition={{ ...strokeTransition, duration: 18 }}
      />
    </div>
  );
}
