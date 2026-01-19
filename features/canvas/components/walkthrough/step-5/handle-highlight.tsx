"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import useFlowStore from "../../../stores/canvas-store";
import {
  useIsStepActive,
  useIsSkipping,
} from "../../../stores/walkthrough-store";
import useWalkthroughStore from "../../../stores/walkthrough-store";
import Checkmark from "./checkmark";

const HandleHighlight = () => {
  const isStep5Active = useIsStepActive(5);
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const hasAdvancedStepRef = useRef(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSkipping = useIsSkipping();
  const initialEdgeCountRef = useRef<number>(0);
  const hasInitializedRef = useRef(false);

  // Reset state when step 5 becomes inactive
  useEffect(() => {
    if (!isStep5Active) {
      setIsSuccess(false);
      setShouldRender(true);
      hasAdvancedStepRef.current = false;
      initialEdgeCountRef.current = 0;
      hasInitializedRef.current = false;
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    }
  }, [isStep5Active]);

  // Identify the walkthrough prompt node and image generator node
  const walkthroughNodes = useMemo(() => {
    const promptNode = nodes.find(
      (n) => n.type === "text-node" && n.data?.isWalkthroughNode === true
    );
    const imageGeneratorNode = nodes.find(
      (n) => n.type === "image-generator-node"
    );

    return { promptNode, imageGeneratorNode };
  }, [nodes]);

  // Track initial edge count when step 5 becomes active
  useEffect(() => {
    if (
      isStep5Active &&
      !hasInitializedRef.current &&
      walkthroughNodes.promptNode &&
      walkthroughNodes.imageGeneratorNode
    ) {
      // Count edges connecting prompt node to image generator node
      const connectingEdges = edges.filter(
        (edge) =>
          edge.source === walkthroughNodes.promptNode?.id &&
          edge.target === walkthroughNodes.imageGeneratorNode?.id
      );
      initialEdgeCountRef.current = connectingEdges.length;
      hasInitializedRef.current = true;
    } else if (!isStep5Active) {
      initialEdgeCountRef.current = 0;
      hasInitializedRef.current = false;
    }
  }, [
    isStep5Active,
    walkthroughNodes.promptNode,
    walkthroughNodes.imageGeneratorNode,
    edges,
  ]);

  // Detect when connection is made
  useEffect(() => {
    if (
      !isStep5Active ||
      isSuccess ||
      !walkthroughNodes.promptNode ||
      !walkthroughNodes.imageGeneratorNode
    ) {
      return;
    }

    // Count edges connecting prompt node to image generator node
    const connectingEdges = edges.filter(
      (edge) =>
        edge.source === walkthroughNodes.promptNode?.id &&
        edge.target === walkthroughNodes.imageGeneratorNode?.id
    );
    const currentCount = connectingEdges.length;

    if (currentCount > initialEdgeCountRef.current) {
      setIsSuccess(true);
    }
  }, [
    edges,
    isStep5Active,
    isSuccess,
    walkthroughNodes.promptNode,
    walkthroughNodes.imageGeneratorNode,
  ]);

  // Trigger exit when success is achieved
  useEffect(() => {
    if (!isSuccess || hasAdvancedStepRef.current) {
      return;
    }

    // Double-check that step 5 is not already completed
    const storeState = useWalkthroughStore.getState();
    if (storeState.stepCompleted[5]) {
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
      isStep5Active &&
      shouldRender &&
      !hasAdvancedStepRef.current
    ) {
      // Mark that we're starting the exit process
      hasAdvancedStepRef.current = true;
      // Trigger exit
      setShouldRender(false);
    }
  }, [isSkipping, isStep5Active, shouldRender]);

  if (!isStep5Active || !shouldRender) {
    return null;
  }

  return (
    <>
      <Checkmark isVisible={isSuccess} />
    </>
  );
};

export default HandleHighlight;
