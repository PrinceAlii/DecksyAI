"use client";

import { Children, ReactNode } from "react";
import { motion } from "framer-motion";

interface HeroContentProps {
  children: ReactNode;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export function HeroContent({ children }: HeroContentProps) {
  const items = Children.toArray(children);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative z-10 flex flex-col items-center text-center"
    >
      {items.map((child, index) => (
        <motion.div key={index} variants={itemVariants} className="w-full">
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
