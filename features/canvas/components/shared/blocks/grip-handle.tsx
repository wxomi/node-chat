"use client";

import React, { memo, useCallback } from "react";
import Image from "next/image";
import { MultipleBlocksIcon, SingleBlockIcon } from "@/constants/icons";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type GripHandleProps = {
  isDisabled?: boolean;
  isLifted?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onClick?: (e: React.MouseEvent) => void;
  tooltipText?: {
    default: string;
    lifted: string;
  };
  className?: string;
};

const GripHandle: React.FC<GripHandleProps> = memo(
  ({
    isDisabled = false,
    isLifted = false,
    onDragStart,
    onDragEnd,
    onClick,
    tooltipText = {
      default: "Drag to turn into a block",
      lifted: "Place anywhere on the canvas",
    },
    className,
  }) => {
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick?.(e);
      },
      [onClick]
    );

    return (
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleClick}
            draggable={!isDisabled}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            disabled={isDisabled}
            className={cn(
              "absolute top-3 right-2 z-10 bg-transparent border-none rounded-[4px] p-1.5 outline-none focus:outline-none hover:bg-muted nodrag",
              isDisabled
                ? "cursor-not-allowed text-muted-foreground/50"
                : "cursor-grab active:cursor-grabbing text-muted-foreground hover:text-white",
              isLifted && !isDisabled && "text-white bg-muted",
              !isDisabled && "group",
              className
            )}
          >
            <div className="relative">
              <Image
                src={MultipleBlocksIcon}
                alt="Multiple Blocks"
                width={10}
                height={10}
                className={cn(
                  !isDisabled && "group-hover:brightness-0 group-hover:invert",
                  isLifted && !isDisabled && "brightness-0 invert"
                )}
              />
              <div
                className={cn(
                  "absolute -top-[-0.5px] right-[0.5px] transition-transform duration-200 ease-out",
                  !isDisabled &&
                    "group-hover:translate-y-[-2px] group-hover:translate-x-[2px]",
                  isLifted &&
                    !isDisabled &&
                    "translate-y-[-2px] translate-x-[2px]"
                )}
              >
                <Image
                  src={SingleBlockIcon}
                  alt="Single Block"
                  width={5}
                  height={5}
                  className={cn(
                    !isDisabled &&
                      "group-hover:brightness-0 group-hover:invert",
                    isLifted && !isDisabled && "brightness-0 invert"
                  )}
                />
              </div>
            </div>
          </button>
        </TooltipTrigger>
        {!isDisabled && (
          <TooltipContent
            side="right"
            align="center"
            sideOffset={12}
            className="bg-muted text-white text-caption-desktop-regular py-1 px-3 rounded-md border border-node-selected"
          >
            <p>{isLifted ? tooltipText.lifted : tooltipText.default}</p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  }
);

GripHandle.displayName = "GripHandle";

export default GripHandle;
