"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type SettingsTextareaProps = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
  tooltipText?: string;
  showTooltip?: boolean;
  tooltipSide?: "top" | "bottom" | "left" | "right";
  tooltipSideOffset?: number;
};

export const SettingsTextarea: React.FC<SettingsTextareaProps> = React.memo(
  ({
    value,
    onChange,
    disabled = false,
    placeholder = "Enter your prompt here...",
    rows = 4,
    className,
    tooltipText = "Select \"Creative\" enhancement to enable prompt",
    showTooltip = false,
    tooltipSide = "bottom",
    tooltipSideOffset = 32,
  }) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <textarea
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={cn(
              "w-full resize-none border border-[#27293D] rounded-lg py-3 pl-3 pr-4 bg-muted text-caption-desktop-regular placeholder:text-muted-foreground outline-none overflow-y-auto connection-menu-scrollbar max-h-[240px]",
              disabled && "opacity-50 cursor-not-allowed",
              className
            )}
            placeholder={placeholder}
            rows={rows}
          />
        </TooltipTrigger>
        {showTooltip && (
          <TooltipContent
            side={tooltipSide}
            align="center"
            sideOffset={tooltipSideOffset}
            className="bg-muted text-white text-caption-desktop-regular py-1 px-3 rounded-md border border-border"
          >
            <p>{tooltipText}</p>
          </TooltipContent>
        )}
      </Tooltip>
    );
  }
);

SettingsTextarea.displayName = "SettingsTextarea";

