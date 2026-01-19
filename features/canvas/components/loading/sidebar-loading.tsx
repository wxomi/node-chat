"use client";

import React from "react";
import { SidebarMenuItem } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { SidebarIndicator } from "@/lib/animations/sidebar-indicator";
import { sidebarMenuItems } from "@/features/canvas/constants";

// Skeleton loader component
const SkeletonMenuItem = () => (
  <div
    className={cn(
      "!min-w-12 !min-h-12 justify-center relative overflow-hidden cursor-pointer",
      "!m-0 animate-pulse bg-[#2a2d3a]"
    )}
  >
    {/* Hidden indicator while loading */}
    <SidebarIndicator
      isActive={false}
      className="absolute size-6 bg-white rounded-sm"
      isLoading={true}
    />
  </div>
);

export const SidebarLoadingSkeletons = () => (
  <>
    {Array.from({ length: sidebarMenuItems.length }).map((_, index) => (
      <SidebarMenuItem key={`skeleton-${index}`}>
        <SkeletonMenuItem />
      </SidebarMenuItem>
    ))}
  </>
);
