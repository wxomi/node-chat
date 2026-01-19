"use client";

import React, { useEffect, useRef, useMemo, useState } from "react";
import useFlowStore from "../../../stores/canvas-store";
import {
  useIsStepActive,
  useIsSkipping,
} from "../../../stores/walkthrough-store";
import useWalkthroughStore from "../../../stores/walkthrough-store";
import Checkmark from "../step-5/checkmark";

const WalkthroughSuggestions = () => {
  const isStep7Active = useIsStepActive(7);
  const nodes = useFlowStore((state) => state.nodes);
  const rfInstance = useFlowStore((state) => state.rfInstance);
  const isSkipping = useIsSkipping();
  const [isSuccess, setIsSuccess] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const hasZoomedRef = useRef(false);
  const hasAdvancedStepRef = useRef(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialVideoGeneratorCountRef = useRef<number>(0);
  const hasInitializedRef = useRef(false);

  // Identify the image generator node
  const imageGeneratorNode = useMemo(() => {
    return nodes.find((n) => n.type === "image-generator-node");
  }, [nodes]);

  // Programmatically zoom out and pan camera when step 7 becomes active
  useEffect(() => {
    if (
      !isStep7Active ||
      !rfInstance ||
      !imageGeneratorNode ||
      hasZoomedRef.current
    ) {
      return;
    }

    // Get current viewport
    const currentViewport = rfInstance.getViewport();

    // Calculate zoom out: reduce zoom by about 20-30%
    const targetZoom = Math.max(0.5, currentViewport.zoom * 0.8);

    // Get node position and dimensions
    const nodePosition = imageGeneratorNode.position;
    const nodeWidth = imageGeneratorNode.width || 420;
    const nodeHeight = imageGeneratorNode.height || 200;

    // Calculate center of the node in flow coordinates
    const nodeCenterX = nodePosition.x + nodeWidth / 2;
    const nodeCenterY = nodePosition.y + nodeHeight / 2;

    // Get viewport center in screen coordinates
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportCenterX = viewportWidth / 2;
    const viewportCenterY = viewportHeight / 2;

    // Convert viewport center to flow coordinates at target zoom
    // Pan camera to bring image generator node slightly to the left
    // Subtract offset to move node left (e.g., 200-300px)
    const targetX = viewportCenterX - nodeCenterX * targetZoom - 200;
    const targetY = viewportCenterY - nodeCenterY * targetZoom - 200;

    // Set viewport with smooth transition
    rfInstance.setViewport(
      {
        x: targetX,
        y: targetY,
        zoom: targetZoom,
      },
      {
        duration: 800, // Smooth 800ms transition
      }
    );

    hasZoomedRef.current = true;
  }, [isStep7Active, rfInstance, imageGeneratorNode]);

  // Reset state when step 7 becomes inactive
  useEffect(() => {
    if (!isStep7Active) {
      hasZoomedRef.current = false;
      hasAdvancedStepRef.current = false;
      hasInitializedRef.current = false;
      initialVideoGeneratorCountRef.current = 0;
      setIsSuccess(false);
      setShouldRender(true);
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    }
  }, [isStep7Active]);

  // Track initial video generator node count when step 7 becomes active
  useEffect(() => {
    if (isStep7Active && !hasInitializedRef.current) {
      const videoGeneratorNodes = nodes.filter(
        (n) => n.type === "video-generator-node"
      );
      initialVideoGeneratorCountRef.current = videoGeneratorNodes.length;
      hasInitializedRef.current = true;
    }
  }, [isStep7Active, nodes]);

  // Detect when video generator node is added and show checkmark
  useEffect(() => {
    if (
      !isStep7Active ||
      hasAdvancedStepRef.current ||
      !hasInitializedRef.current ||
      isSuccess
    ) {
      return;
    }

    const videoGeneratorNodes = nodes.filter(
      (n) => n.type === "video-generator-node"
    );
    const currentCount = videoGeneratorNodes.length;
    const initialCount = initialVideoGeneratorCountRef.current;

    // Check if a new video generator node was added
    if (currentCount > initialCount) {
      // Double-check that step 7 is not already completed
      const storeState = useWalkthroughStore.getState();
      if (storeState.stepCompleted[7]) {
        hasAdvancedStepRef.current = true;
        return;
      }

      // Set success state to show checkmark
      setIsSuccess(true);
    }
  }, [nodes, isStep7Active, isSuccess]);

  // Trigger exit when success is achieved
  useEffect(() => {
    if (!isSuccess || hasAdvancedStepRef.current) {
      return;
    }

    // Double-check that step 7 is not already completed
    const storeState = useWalkthroughStore.getState();
    if (storeState.stepCompleted[7]) {
      hasAdvancedStepRef.current = true;
      return;
    }

    // Mark that we're starting the exit process
    hasAdvancedStepRef.current = true;

    // Wait for checkmark to appear, then advance to next step
    exitTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
      // Advance to next step after checkmark is shown
      if (!storeState.isSkipping) {
        storeState.nextStep();
      }
    }, 800); // Wait 800ms for checkmark to be visible before exiting

    // Cleanup timeout if component unmounts or conditions change
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, [isSuccess]);

  // Handle skip trigger - exit when skipping
  useEffect(() => {
    if (
      isSkipping &&
      isStep7Active &&
      shouldRender &&
      !hasAdvancedStepRef.current
    ) {
      // Mark that we're starting the exit process
      hasAdvancedStepRef.current = true;
      // Trigger exit
      setShouldRender(false);
    }
  }, [isSkipping, isStep7Active, shouldRender]);

  if (!isStep7Active || !shouldRender) {
    return null;
  }

  return (
    <>
      <Checkmark isVisible={isSuccess} />
    </>
  );
};

export default WalkthroughSuggestions;
