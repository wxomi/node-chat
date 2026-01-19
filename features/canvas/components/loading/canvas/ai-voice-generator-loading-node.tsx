"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerTime,
} from "@/components/ui/audio-player";
import GenerateButton from "../../shared/generate-button/generate-button";

type AIVoiceGeneratorLoadingNodeProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
};

export const AIVoiceGeneratorLoadingNode = ({
  containerRef,
}: AIVoiceGeneratorLoadingNodeProps) => {
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
    <AudioPlayerProvider>
      <motion.div
        className={cn(
          "z-10 bg-popover rounded-xl p-4 min-w-[420px] border border-popover absolute top-[8%] right-[4%] ring-1 ring-node-selected ring-offset-2 ring-offset-background",
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
        <div className="text-body-desktop-medium mb-3">Generate Voice</div>

        {/* Audio preview */}
        <div className="mb-4">
          <div className="bg-accent rounded-lg p-3 border border-border">
            <div className="flex items-center gap-3">
              <AudioPlayerButton
                size="icon-sm"
                className="bg-[#1e1f32] text-white border border-border cursor-pointer hover:bg-[#1a1b2e]"
              />
              <div className="flex items-center gap-2 flex-1">
                <AudioPlayerTime className="text-xs text-muted-foreground" />
                <AudioPlayerProgress className="flex-1 [&_.bg-muted]:bg-muted [&_.bg-primary]:bg-primary [&_.bg-foreground]:bg-primary" />
                <AudioPlayerDuration className="text-xs text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <div className="flex justify-end">
          <GenerateButton
            onClick={() => {}}
            disabled={false}
            isLoading={false}
          />
        </div>

        {/* Placeholder output handle (right side) */}
        <div
          className="absolute right-0 top-[50px] flex items-center justify-center size-5"
          style={{ transform: "translateX(50%)" }}
        >
          <div className="size-3 rounded-full flex items-center justify-center bg-chart-3">
            <div className="bg-popover size-2 rounded-full flex items-center justify-center">
              <div className="size-1 rounded-full bg-chart-3" />
            </div>
          </div>
        </div>

        {/* Placeholder input handle (left side) */}
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
      </motion.div>
    </AudioPlayerProvider>
  );
};
