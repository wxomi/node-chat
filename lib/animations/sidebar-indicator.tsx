"use client";

import { motion } from "motion/react";

type SidebarIndicatorProps = {
  isActive: boolean;
  className?: string;
  isLoading?: boolean;
};

export const SidebarIndicator = ({
  isActive,
  className,
  isLoading = false,
}: SidebarIndicatorProps) => {
  if (isLoading) {
    return null;
  }

  return (
    <motion.div
      className={className}
      initial={{
        x: isActive ? -30 : -60,
      }}
      animate={{
        x: isActive ? -30 : -60,
      }}
      transition={{
        ease: "easeOut",
        duration: 0.15,
      }}
    />
  );
};
