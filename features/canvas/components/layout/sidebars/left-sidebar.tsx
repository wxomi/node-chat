"use client";

import React, { useState, Suspense, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
} from "@/components/ui/sidebar";
import Image from "next/image";
import MagichoHourLogo from "@/public/icons/magic-hour-logo.svg";
import { SidebarLoadingSkeletons } from "@/features/canvas/components/loading/sidebar-loading";
import NodeMenu from "../node-menu/node-menu";
import {
  useIsStepActive,
  useIsWalkthroughActive,
} from "../../../stores/walkthrough-store";
import useWalkthroughStore from "../../../stores/walkthrough-store";
import { useCanvasLoadingStore } from "../../../stores/canvas-loading-store";

// Preload the sidebar menu items component
const sidebarMenuItemsPromise = import("./sidebar-menu-items").then(
  (mod) => mod.SidebarMenuItems
);

// Lazy load the actual menu items
const SidebarMenuItems = dynamic(
  () => import("./sidebar-menu-items").then((mod) => mod.SidebarMenuItems),
  {
    ssr: false,
  }
);

const LeftSidebar = () => {
  const [isActive, setIsActive] = useState<string>("");
  const isStep4Active = useIsStepActive(4);
  const isWalkthroughActive = useIsWalkthroughActive();
  const hasReopenedAfterWalkthroughRef = useRef(false);
  const previousWalkthroughActiveRef = useRef<boolean | null>(null);
  const sidebarMenuLoadedRef = useRef(false);
  const setSidebarMenuLoaded = useCanvasLoadingStore(
    (state) => state.setSidebarMenuLoaded
  );

  // Track when SidebarMenuItems component has loaded
  // Preload the component and track when the promise resolves
  useEffect(() => {
    if (!sidebarMenuLoadedRef.current) {
      sidebarMenuItemsPromise
        .then(() => {
          if (!sidebarMenuLoadedRef.current) {
            sidebarMenuLoadedRef.current = true;
            setSidebarMenuLoaded(true);
          }
        })
        .catch(() => {
          // If preload fails, mark as loaded anyway after a delay
          // This ensures the loading screen doesn't hang forever
          setTimeout(() => {
            if (!sidebarMenuLoadedRef.current) {
              sidebarMenuLoadedRef.current = true;
              setSidebarMenuLoaded(true);
            }
          }, 500);
        });
    }
  }, [setSidebarMenuLoaded]);

  // Auto-open image-tools section when step 4 is active
  useEffect(() => {
    if (isStep4Active && isActive !== "image-tools") {
      setIsActive("image-tools");
    }
  }, [isStep4Active, isActive]);

  // Reopen image-tools when walkthrough ends (if user completed step 4 or later)
  // Only reopen once when walkthrough transitions from active to inactive
  useEffect(() => {
    const wasWalkthroughActive = previousWalkthroughActiveRef.current;
    const isNowInactive = !isWalkthroughActive;

    // Track previous state
    previousWalkthroughActiveRef.current = isWalkthroughActive;

    // Reset flag when walkthrough becomes active again (for future walkthroughs)
    if (isWalkthroughActive) {
      hasReopenedAfterWalkthroughRef.current = false;
      return;
    }

    // Only reopen if walkthrough just ended (transitioned from active to inactive)
    // and we haven't already reopened it
    if (
      wasWalkthroughActive === true &&
      isNowInactive &&
      !hasReopenedAfterWalkthroughRef.current
    ) {
      const storeState = useWalkthroughStore.getState();
      // Check if step 4 was completed (user dragged the image generator node)
      const step4Completed = storeState.stepCompleted[4] ?? false;
      // If step 4 was completed, reopen image-tools sidebar once
      if (step4Completed) {
        setIsActive("image-tools");
        hasReopenedAfterWalkthroughRef.current = true;
      }
    }
  }, [isWalkthroughActive]);

  // Reset sidebar to closed state when step 4 becomes inactive (before advancing)
  // But only if walkthrough is still active
  useEffect(() => {
    if (isWalkthroughActive && !isStep4Active && isActive === "image-tools") {
      setIsActive("");
    }
  }, [isStep4Active, isActive, isWalkthroughActive]);

  const handleActive = (id: string) => {
    // Prevent opening menu during walkthrough unless step 4 is active
    if (isWalkthroughActive && !isStep4Active) {
      return;
    }
    setIsActive(id === isActive ? "" : id);
  };

  return (
    <>
      <Sidebar
        collapsible="icon"
        className="border-r border-sidebar-border bg-sidebar-background py-6 !w-[70px] relative z-20"
      >
        <SidebarHeader className="">
          <div className="flex items-center justify-center">
            <Image
              src={MagichoHourLogo}
              alt="Magic Hour"
              width={32}
              height={32}
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="mt-6">
          <SidebarMenu className="px-4 flex flex-col justify-center items-center gap-2">
            <Suspense fallback={<SidebarLoadingSkeletons />}>
              <SidebarMenuItems
                isActive={isActive}
                onSetActive={handleActive}
              />
            </Suspense>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      {/* Node Menu */}
      <NodeMenu isVisible={!!isActive} selectedSection={isActive} />
    </>
  );
};

export default LeftSidebar;
