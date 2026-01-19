"use client";

import React from "react";
import { motion } from "motion/react";

type AssetPreviewAnimationProps = {
  children: React.ReactNode;
  className?: string;
};

export const AssetPreviewAnimation: React.FC<AssetPreviewAnimationProps> =
  React.memo(({ children, className }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
        transition={{ duration: 0.15 }}
        className={className}
        style={{ willChange: "transform" }}
      >
        {children}
      </motion.div>
    );
  });

AssetPreviewAnimation.displayName = "AssetPreviewAnimation";

// Soundwave Bar Animation Component
type SoundwaveBarProps = {
  heights: [string, string, string];
  duration: number;
  delay?: number;
  color?: string;
};

export const SoundwaveBar: React.FC<SoundwaveBarProps> = React.memo(
  ({ heights, duration, delay = 0, color = "bg-red-500" }) => {
    return (
      <motion.div
        className={`w-0.5 ${color} rounded-full`}
        animate={{
          height: heights,
        }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
        style={{ willChange: "transform" }}
      />
    );
  }
);

SoundwaveBar.displayName = "SoundwaveBar";
