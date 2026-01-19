"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import GenerateButton from "@/features/canvas/components/shared/generate-button/generate-button";
import { Button } from "@/components/ui/button";
import { AspectRatioIcon } from "@/constants/icons";
import { getImagePreviewDimensions } from "@/features/canvas/lib/shared";
import Image from "next/image";

const PrototypePage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canDrag, setCanDrag] = useState(false);
  const [isPromptHovered, setIsPromptHovered] = useState(false);
  const [isPromptDragging, setIsPromptDragging] = useState(false);
  const [showReplacementPrompt, setShowReplacementPrompt] = useState(false);
  const promptBoxRef = useRef<HTMLDivElement>(null);

  // Enable drag after initial animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanDrag(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Get image preview dimensions
  const { containerDimensionsMap, previewDimensionsMap } =
    getImagePreviewDimensions();
  const orientation = "square" as const;

  // Calculate total height:
  // - containerDimensionsMap already includes: title, preview, button area (mt-4 + button height), padding
  // - We need to add: textarea (minHeight 40px + mb-3 margin 12px)
  const textareaHeight = 72 + 12; // minHeight + mb-3 margin
  const totalHeight =
    containerDimensionsMap[orientation].height + textareaHeight;

  return (
    <div
      ref={containerRef}
      className="h-screen w-screen bg-background relative overflow-hidden"
    >
      <motion.div
        className={cn(
          "z-10 bg-popover rounded-xl p-4 border border-popover absolute top-[8%] left-[4%]",
          isDragging
            ? "cursor-grabbing"
            : canDrag
            ? "cursor-grab"
            : "cursor-default"
        )}
        style={{
          borderRadius: "14px",
          width: containerDimensionsMap[orientation].width,
          height: `${totalHeight}px`,
        }}
        initial={{
          opacity: 0,
          scale: 0.7,
          rotate: 8,
        }}
        animate={{
          opacity: 1,
          scale: 1.5,
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
        <div className="text-body-desktop-medium mb-3">Generate Image</div>

        {/* prompt box container */}
        <div className="mb-3 relative">
          <motion.div
            ref={promptBoxRef}
            className={cn(
              "w-full resize-none border border-[#27293D] rounded-lg p-3 bg-accent text-caption-desktop-regular outline-none overflow-hidden relative z-10",
              isPromptDragging
                ? "cursor-grabbing"
                : isPromptHovered
                ? "cursor-grab"
                : "cursor-pointer"
            )}
            style={{
              minHeight: "72px",
              height: "72px",
            }}
            initial={{
              boxShadow: "none",
            }}
            whileHover={{
              y: -20,
              rotate: -2,
              boxShadow:
                "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 25,
              },
            }}
            drag={isPromptHovered}
            dragConstraints={containerRef}
            dragElastic={0.2}
            onHoverStart={() => setIsPromptHovered(true)}
            onHoverEnd={() => {
              if (!isPromptDragging) {
                setIsPromptHovered(false);
              }
            }}
            onDragStart={() => setIsPromptDragging(true)}
            onDrag={(event, info) => {
              // Check if dragged more than 50px away from origin
              if (
                Math.abs(info.offset.x) > 50 ||
                Math.abs(info.offset.y) > 50
              ) {
                setShowReplacementPrompt(true);
              }
            }}
            onDragEnd={() => {
              setIsPromptDragging(false);
              setIsPromptHovered(false);
            }}
          >
            <span className="text-muted-foreground">
              Enter your prompt here...
            </span>
          </motion.div>

          {/* Replacement prompt box that appears when original is dragged away */}
          {showReplacementPrompt && (
            <motion.div
              className={cn(
                "w-full resize-none border border-[#27293D] rounded-lg p-3 bg-accent text-caption-desktop-regular outline-none overflow-hidden absolute top-0 left-0 z-[5]",
                isPromptDragging
                  ? "cursor-grabbing"
                  : isPromptHovered
                  ? "cursor-grab"
                  : "cursor-pointer"
              )}
              style={{
                minHeight: "72px",
                height: "72px",
              }}
              initial={{
                opacity: 0,
                scale: 0.8,
                boxShadow: "none",
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              whileHover={{
                y: -20,
                rotate: -2,
                boxShadow:
                  "0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25,
                },
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
              }}
              drag={isPromptHovered}
              dragConstraints={containerRef}
              dragElastic={0.2}
              onHoverStart={() => setIsPromptHovered(true)}
              onHoverEnd={() => {
                if (!isPromptDragging) {
                  setIsPromptHovered(false);
                }
              }}
              onDragStart={() => setIsPromptDragging(true)}
              onDrag={(event, info) => {
                // Check if dragged more than 50px away from origin
                if (
                  Math.abs(info.offset.x) > 50 ||
                  Math.abs(info.offset.y) > 50
                ) {
                  setShowReplacementPrompt(true);
                }
              }}
              onDragEnd={() => {
                setIsPromptDragging(false);
                setIsPromptHovered(false);
              }}
            >
              <span className="text-muted-foreground">
                Enter your prompt here...
              </span>
            </motion.div>
          )}

          {/* Div that appears under the prompt box when lifted - shows empty space */}
          <motion.div
            className="w-full rounded-lg bg-secondary-foreground absolute top-0 z-0"
            style={{
              height: "72px",
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: isPromptHovered || showReplacementPrompt ? 1 : 0,
            }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
            }}
          />
        </div>

        {/* Image preview component */}
        <div
          className="mb-3 w-full bg-accent border border-[#27293D] rounded-lg overflow-hidden flex items-center justify-center relative group transition-[height] duration-300 ease-in-out"
          style={{
            height: `${previewDimensionsMap[orientation].height}px`,
          }}
        >
          <span className="text-xs text-muted-foreground py-8">
            No image generated
          </span>
        </div>

        {/* Generate button */}
        <div className="flex items-center justify-end mt-4 gap-2">
          <Button
            variant="outline"
            onClick={() => {}}
            className="h-[26px] w-[26px] p-0"
          >
            <Image
              src={AspectRatioIcon}
              alt="aspect ratio"
              width={16}
              height={16}
            />
          </Button>
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
          <div className="size-3 rounded-full flex items-center justify-center bg-chart-2">
            <div className="bg-popover size-2 rounded-full flex items-center justify-center">
              <div className="size-1 rounded-full bg-chart-2" />
            </div>
          </div>
        </div>

        {/* Placeholder input handle (left side) - Prompt */}
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
    </div>
  );
};

export default PrototypePage;
