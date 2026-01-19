"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import VideoPreview from "../../shared/assets/video-preview";
import GenerateButton from "../../shared/generate-button/generate-button";

type VideoGeneratorLoadingNodeProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export const VideoGeneratorLoadingNode = ({
  containerRef,
}: VideoGeneratorLoadingNodeProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [canDrag, setCanDrag] = useState(false);

  // Enable drag after initial animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanDrag(true);
    }, 2500); // 0.5s delay + ~1s for spring animation
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className={cn(
        "z-10 bg-popover rounded-xl p-4 min-w-[500px] border border-popover absolute bottom-[8%] right-[4%] ring-1 ring-node-selected ring-offset-2 ring-offset-background",
        isDragging
          ? "cursor-grabbing"
          : canDrag
          ? "cursor-grab"
          : "cursor-default"
      )}
      initial={{
        opacity: 0,
        scale: 0.7,
        rotate: -8,
      }}
      animate={{
        opacity: 1,
        scale: 0.8,
        rotate: 0,
      }}
      transition={{
        delay: 1,
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
      <div className="text-body-desktop-medium mb-3">Generate Video</div>

      {/* Video preview component */}
      <VideoPreview videoUrl={undefined} isGenerating={false} />

      {/* Generate button */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex flex-row gap-2 h-6"></div>
        <GenerateButton onClick={() => {}} disabled={false} isLoading={false} />
      </div>

      {/* Placeholder output handle (right side) */}
      <div
        className="absolute right-0 top-[50px] flex items-center justify-center size-5"
        style={{ transform: "translateX(50%)" }}
      >
        <div className="size-3 rounded-full flex items-center justify-center bg-chart-5">
          <div className="bg-popover size-2 rounded-full flex items-center justify-center">
            <div className="size-1 rounded-full bg-chart-5" />
          </div>
        </div>
      </div>

      {/* Placeholder input handles (left side) */}
      <div
        className="absolute left-0 top-[50px] flex items-center justify-center size-5"
        style={{ transform: "translateX(-50%)" }}
      >
        <div className="size-3 rounded-full flex items-center justify-center bg-chart-1">
          <div className="bg-popover size-2 rounded-full flex items-center justify-center">
            <div className="size-1 rounded-full bg-chart-1" />
          </div>
        </div>
      </div>
      <div
        className="absolute left-0 top-[90px] flex items-center justify-center size-5"
        style={{ transform: "translateX(-50%)" }}
      >
        <div className="size-3 rounded-full flex items-center justify-center bg-chart-2">
          <div className="bg-popover size-2 rounded-full flex items-center justify-center">
            <div className="size-1 rounded-full bg-chart-2" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
