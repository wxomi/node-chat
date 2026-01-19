"use client";

import React from "react";
import { motion } from "motion/react";

type FadeInAnimationProps = {
  children: React.ReactNode;
  className?: string;
};

export const FadeInAnimation: React.FC<FadeInAnimationProps> = React.memo(
  ({ children, className }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}


        className={className}
      >
        {children}
      </motion.div>
    );
  }
);

FadeInAnimation.displayName = "FadeInAnimation";

