"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import useFlowStore from "../../../stores/canvas-store";
import {
  useIsStepActive,
  useIsSkipping,
} from "../../../stores/walkthrough-store";
import useWalkthroughStore from "../../../stores/walkthrough-store";
import Checkmark from "../step-5/checkmark";

const WalkthroughGenerateButton = () => {
  const isStep6Active = useIsStepActive(6);
  const nodes = useFlowStore((state) => state.nodes);
  const rfInstance = useFlowStore((state) => state.rfInstance);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const hasAdvancedStepRef = useRef(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSkipping = useIsSkipping();
  const initialGeneratedImageIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const hasZoomedRef = useRef(false);

  // Reset state when step 6 becomes inactive
  useEffect(() => {
    if (!isStep6Active) {
      setIsSuccess(false);
      setShouldRender(true);
      hasAdvancedStepRef.current = false;
      initialGeneratedImageIdRef.current = null;
      hasInitializedRef.current = false;
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    }
  }, [isStep6Active]);

  // Identify the image generator node
  const imageGeneratorNode = useMemo(() => {
    return nodes.find((n) => n.type === "image-generator-node");
  }, [nodes]);

  // Programmatically zoom in on image generator node when step 6 becomes active
  useEffect(() => {
    if (
      !isStep6Active ||
      !rfInstance ||
      !imageGeneratorNode ||
      hasZoomedRef.current
    ) {
      return;
    }

    // Get current viewport
    const currentViewport = rfInstance.getViewport();

    // Calculate zoom in: increase zoom by about 50-75%
    const targetZoom = Math.min(2, currentViewport.zoom * 1.2);

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
    // We need to calculate what viewport position would center the node
    // Formula: viewport.x = viewportCenterX - (nodeCenterX * zoom)
    const targetX = viewportCenterX - nodeCenterX * targetZoom;
    const targetY = viewportCenterY - nodeCenterY * targetZoom - 200; // Offset to position node higher

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
  }, [isStep6Active, rfInstance, imageGeneratorNode]);

  // Reset zoom flag when step 6 becomes inactive
  useEffect(() => {
    if (!isStep6Active) {
      hasZoomedRef.current = false;
    }
  }, [isStep6Active]);

  // Track initial generatedImageId when step 6 becomes active
  useEffect(() => {
    if (isStep6Active && !hasInitializedRef.current && imageGeneratorNode) {
      const generatedImageId = imageGeneratorNode.data?.generatedImageId as
        | string
        | undefined;
      initialGeneratedImageIdRef.current = generatedImageId || null;
      hasInitializedRef.current = true;
    } else if (!isStep6Active) {
      initialGeneratedImageIdRef.current = null;
      hasInitializedRef.current = false;
    }
  }, [isStep6Active, imageGeneratorNode]);

  // Detect when generate button is clicked (generatedImageId is set)
  useEffect(() => {
    if (!isStep6Active || isSuccess || !imageGeneratorNode) {
      return;
    }

    const currentGeneratedImageId = imageGeneratorNode.data
      ?.generatedImageId as string | undefined;
    const initialId = initialGeneratedImageIdRef.current;

    // Check if generatedImageId was just set (button was clicked)
    if (currentGeneratedImageId && currentGeneratedImageId !== initialId) {
      setIsSuccess(true);
    }
  }, [
    imageGeneratorNode?.data?.generatedImageId,
    isStep6Active,
    isSuccess,
    imageGeneratorNode,
  ]);

  // Trigger exit when success is achieved
  useEffect(() => {
    if (!isSuccess || hasAdvancedStepRef.current) {
      return;
    }

    // Double-check that step 6 is not already completed
    const storeState = useWalkthroughStore.getState();
    if (storeState.stepCompleted[6]) {
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
      isStep6Active &&
      shouldRender &&
      !hasAdvancedStepRef.current
    ) {
      // Mark that we're starting the exit process
      hasAdvancedStepRef.current = true;
      // Trigger exit
      setShouldRender(false);
    }
  }, [isSkipping, isStep6Active, shouldRender]);

  if (!isStep6Active || !shouldRender) {
    return null;
  }

  return (
    <>
      <Checkmark isVisible={isSuccess} />
    </>
  );
};

export default WalkthroughGenerateButton;
