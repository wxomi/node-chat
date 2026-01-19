"use client";

import React from "react";
import Image from "next/image";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { sidebarMenuItems } from "@/features/canvas/constants";
import { cn } from "@/lib/utils";
import { SidebarIndicator } from "@/lib/animations/sidebar-indicator";
import {
  useIsWalkthroughActive,
  useIsStepActive,
} from "../../../stores/walkthrough-store";

type SidebarMenuItemsProps = {
  isActive: string;
  onSetActive: (id: string) => void;
};

export const SidebarMenuItems = ({
  isActive,
  onSetActive,
}: SidebarMenuItemsProps) => {
  const isWalkthroughActive = useIsWalkthroughActive();
  const isStep4Active = useIsStepActive(4);

  // Disable sidebar interactions during walkthrough unless step 4 is active
  const isDisabled = isWalkthroughActive && !isStep4Active;

  const handleClick = (id: string) => {
    if (isDisabled) return;
    onSetActive(id);
  };

  return (
    <>
      {sidebarMenuItems.map((item) => (
        <SidebarMenuItem key={item.id}>
          {/* sidebar menu button container */}
          <SidebarMenuButton
            tooltip={item.tooltip}
            size={item.size}
            isActive={isActive === item.id}
            className={cn(
              "!min-w-12 !min-h-12 justify-center relative overflow-hidden",
              isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
              isActive === item.id ? "!bg-accent" : "hover:!bg-[#333544]"
            )}
            onClick={() => handleClick(item.id)}
            disabled={isDisabled}
          >
            <Image
              src={item.icon}
              alt={item.tooltip}
              width={18}
              height={18}
              className={cn(
                "transition-all duration-200",
                isActive === item.id
                  ? "brightness-0 invert" // Makes SVG white for active state
                  : "" // Keep default colors for normal and hover states
              )}
            />
            {/* animatable pop up */}
            <SidebarIndicator
              isActive={isActive === item.id}
              className="absolute size-6 bg-white rounded-sm"
            />
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </>
  );
};
