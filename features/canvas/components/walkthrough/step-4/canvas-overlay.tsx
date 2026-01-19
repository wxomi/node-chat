"use client";

import React, { useEffect, useRef } from "react";
import { useIsStepActive } from "../../../stores/walkthrough-store";
import useFlowStore from "../../../stores/canvas-store";

const CanvasOverlay = () => {
  const isStep4Active = useIsStepActive(4);
  const rfInstance = useFlowStore((state) => state.rfInstance);
  const hasZoomedRef = useRef(false);

  // Programmatically zoom out when step 4 becomes active
  useEffect(() => {
    if (!isStep4Active || !rfInstance || hasZoomedRef.current) {
      return;
    }

    // Get current viewport
    const currentViewport = rfInstance.getViewport();

    // Calculate zoom out: reduce zoom by about 10-15%
    const targetZoom = Math.max(0.5, currentViewport.zoom * 0.75);

    // Pan left a little to show more of the canvas area
    const targetX = currentViewport.x - 100;

    // Set viewport with smooth transition
    rfInstance.setViewport(
      {
        x: targetX,
        y: currentViewport.y,
        zoom: targetZoom,
      },
      {
        duration: 800, // Smooth 800ms transition
      }
    );

    hasZoomedRef.current = true;
  }, [isStep4Active, rfInstance]);

  // Reset zoom flag when step 4 becomes inactive
  useEffect(() => {
    if (!isStep4Active) {
      hasZoomedRef.current = false;
    }
  }, [isStep4Active]);

  if (!isStep4Active) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-[30] pointer-events-none" />
  );
};

export default CanvasOverlay;
