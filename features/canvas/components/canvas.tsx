"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import React, { useEffect, useMemo } from "react";
import { LeftSidebar, SettingsPanel } from "./layout";
import CanvasContent from "./canvas-content";
import ConfigSidebar from "./layout/sidebars/config-sidebar";
import { CanvasLoadingScreen } from "./loading/canvas";
import {
  useCanvasLoadingStore,
  useIsCanvasReady,
  useIsBackendLoaded,
} from "../stores/canvas-loading-store";
import { AnimatePresence } from "motion/react";
import { WalkthroughStepper } from "./walkthrough";
import { useIsWalkthroughActive } from "../stores/walkthrough-store";

type CanvasProps = {
  canvasId: string | null;
};

const Canvas = ({ canvasId }: CanvasProps) => {
  const setClientHydrated = useCanvasLoadingStore(
    (state) => state.setClientHydrated
  );
  const isCanvasReady = useIsCanvasReady();
  const isBackendLoaded = useIsBackendLoaded();
  const isWalkthroughActive = useIsWalkthroughActive();

  // Track client-side hydration
  useEffect(() => {
    setClientHydrated(true);
  }, [setClientHydrated]);

  // Show walkthrough stepper when walkthrough is active and backend is loaded
  const shouldShowWalkthrough = useMemo(
    () => isWalkthroughActive && isBackendLoaded,
    [isWalkthroughActive, isBackendLoaded]
  );

  return (
    <>
      <AnimatePresence>
        {!isCanvasReady && <CanvasLoadingScreen key="canvas-loading-screen" />}
      </AnimatePresence>

      <SidebarProvider defaultOpen={false}>
        <LeftSidebar />
        <SidebarInset>
          <CanvasContent canvasId={canvasId} />
          <ConfigSidebar />
          <SettingsPanel />
        </SidebarInset>
      </SidebarProvider>

      {/* Walkthrough Stepper - positioned at top level to ensure it's above all components */}
      {shouldShowWalkthrough && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none z-[100]">
          <div className="pointer-events-auto">
            <WalkthroughStepper />
          </div>
        </div>
      )}
    </>
  );
};

export default Canvas;
