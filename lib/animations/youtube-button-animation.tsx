"use client";

import React from "react";
import { motion } from "motion/react";

type YouTubeButtonAnimationProps = {
  isActive: boolean;
  isExpanded: boolean;
  hasUrl: boolean;
  children: React.ReactNode;
  onClick: () => void;
};

export const YouTubeButtonAnimation: React.FC<YouTubeButtonAnimationProps> =
  React.memo(({ isActive, isExpanded, hasUrl, children, onClick }) => {
    return (
      <motion.div
        onClick={onClick}
        animate={{ width: isExpanded ? "300px" : "95px" }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={`border flex items-center gap-0.5 px-2.5 py-[2px] rounded-xl cursor-pointer transition-colors overflow-hidden ${
          isActive
            ? "bg-accent border-border"
            : "bg-popover border-border hover:bg-accent"
        } ${hasUrl ? "shadow-inner shadow-red-500/20" : ""}`}
      >
        {children}
      </motion.div>
    );
  });

YouTubeButtonAnimation.displayName = "YouTubeButtonAnimation";
