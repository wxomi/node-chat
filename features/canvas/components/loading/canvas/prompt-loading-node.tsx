"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MotionTextarea } from "@/components/ui/motion-textarea";
import { cn } from "@/lib/utils";
import { NodeAnimation } from "@/lib/animations/node-animation";

type PromptLoadingNodeProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export const PromptLoadingNode = ({ containerRef }: PromptLoadingNodeProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [canDrag, setCanDrag] = useState(false);

  // Enable drag after initial animation completes (1.5s delay + ~1s animation)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanDrag(true);
    }, 2500); // 1.5s delay + ~1s for slower spring animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className={cn(
        "z-10 bg-popover rounded-xl p-4 min-w-[420px] border border-popover absolute bottom-[8%] left-[4%] ring-1 ring-node-selected ring-offset-2 ring-offset-background",
        isDragging
          ? "cursor-grabbing"
          : canDrag
          ? "cursor-grab"
          : "cursor-default"
      )}
      initial={{
        opacity: 0,
        scale: 0.7,
        rotate: 8,
      }}
      animate={{
        opacity: 1,
        scale: 0.8,
        rotate: 0,
      }}
      transition={{
        delay: 0.5,
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 1,
      }}
      drag={canDrag}
      dragConstraints={containerRef}
      dragElastic={0.2}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
    >
      {/* Node title */}
      <div className="text-body-desktop-medium mb-3">Prompt</div>

      {/* Prompt textarea */}
      <MotionTextarea
        value=""
        onChange={() => {}}
        onBlur={() => {}}
        placeholder="Enter your prompt here..."
        minHeight={160}
        animationDuration={0.15}
        animationEase="easeOut"
      />

      {/* Placeholder output handle (right side) */}
      <div
        className="absolute right-0 top-[50px] flex items-center justify-center size-5"
        style={{ transform: "translateX(50%)" }}
      >
        <div className="size-3 rounded-full flex items-center justify-center bg-chart-1">
          <div className="bg-popover size-2 rounded-full flex items-center justify-center">
            <div className="size-1 rounded-full bg-chart-1" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
