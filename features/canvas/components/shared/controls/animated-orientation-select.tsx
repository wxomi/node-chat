"use client";

import React, { memo, useCallback, useState, useEffect } from "react";
import {
  SquareIcon,
  RectangleHorizontalIcon,
  RectangleVerticalIcon,
} from "lucide-react";
import { Transition, Variants, motion } from "motion/react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Orientation = "square" | "landscape" | "portrait";

type AnimatedOrientationSelectProps = {
  value: Orientation;
  onChange: (value: Orientation) => void;
  className?: string;
};

const AnimatedOrientationSelect: React.FC<AnimatedOrientationSelectProps> =
  memo(({ value, onChange, className }) => {
    // Local state for immediate UI updates
    const [localValue, setLocalValue] = useState<Orientation>(value);

    // Sync local state when prop value changes (but allow local updates to take precedence)
    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const ratioVariants: Variants = {
      hidden: { marginRight: -12 },
      visible: { marginRight: 3 },
    };

    const ratioTransition: Transition = {
      type: "spring" as const,
      stiffness: 500,
      damping: 25,
      mass: 1.5,
    };

    const handleOrientationChange = useCallback(
      (newValue: Orientation) => {
        // Update local state immediately for instant UI feedback
        setLocalValue(newValue);
        // Notify parent to update store
        onChange(newValue);
      },
      [onChange]
    );

    return (
      <motion.div
        className={cn("flex items-center", className)}
        initial="hidden"
        animate="hidden"
        whileHover="visible"
      >
        {/* square aspect ratio */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              type="button"
              onClick={() => handleOrientationChange("square")}
              className="bg-sidebar-accent rounded-full p-2 border border-border z-10 group cursor-pointer"
              whileTap={{ scale: 0.95 }}
              variants={ratioVariants}
              transition={ratioTransition}
            >
              <SquareIcon
                size={12}
                className={cn(
                  "transition-colors duration-300 ease-out",
                  localValue === "square"
                    ? "text-white fill-white"
                    : "text-muted-foreground group-hover:text-white group-hover:fill-white"
                )}
              />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            sideOffset={10}
            className="bg-muted text-white text-caption-desktop-regular py-1 px-3 rounded-md border border-border"
          >
            <p>Square</p>
          </TooltipContent>
        </Tooltip>
        {/* rectangle horizontal aspect ratio */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              type="button"
              onClick={() => handleOrientationChange("landscape")}
              className="bg-sidebar-accent rounded-full p-2 border border-border z-5 group cursor-pointer"
              whileTap={{ scale: 0.95 }}
              variants={ratioVariants}
              transition={ratioTransition}
            >
              <RectangleHorizontalIcon
                size={12}
                className={cn(
                  "transition-colors duration-300 ease-out",
                  localValue === "landscape"
                    ? "text-white fill-white"
                    : "text-muted-foreground group-hover:text-white group-hover:fill-white"
                )}
              />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            sideOffset={10}
            className="bg-muted text-white text-caption-desktop-regular py-1 px-3 rounded-md border border-border"
          >
            <p>Landscape</p>
          </TooltipContent>
        </Tooltip>
        {/* rectangle vertical aspect ratio */}
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              type="button"
              onClick={() => handleOrientationChange("portrait")}
              className="bg-sidebar-accent rounded-full p-2 border border-border z-3 group cursor-pointer"
              whileTap={{ scale: 0.95 }}
            >
              <RectangleVerticalIcon
                size={12}
                className={cn(
                  "transition-colors duration-300 ease-out",
                  localValue === "portrait"
                    ? "text-white fill-white"
                    : "text-muted-foreground group-hover:text-white group-hover:fill-white"
                )}
              />
            </motion.button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            sideOffset={10}
            className="bg-muted text-white text-caption-desktop-regular py-1 px-3 rounded-md border border-border"
          >
            <p>Portrait</p>
          </TooltipContent>
        </Tooltip>
      </motion.div>
    );
  });

AnimatedOrientationSelect.displayName = "AnimatedOrientationSelect";

export default AnimatedOrientationSelect;
