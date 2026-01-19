"use client";

import React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type SettingsItemAnimationProps = {
  children: React.ReactNode;
  className?: string;
};

export const SettingsItemAnimation: React.FC<SettingsItemAnimationProps> =
  React.memo(({ children, className }) => {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    );
  });

SettingsItemAnimation.displayName = "SettingsItemAnimation";

