"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import useFlowStore from "../../../stores/canvas-store";
import { useIsStepActive, useIsSkipping } from "../../../stores/walkthrough-store";
import useWalkthroughStore from "../../../stores/walkthrough-store";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowCloseIcon,
  ArrowOpenIcon,
} from "@/constants/icons";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  OVERLAY_RADIUS,
  getOverlayCenter,
  isNodeCoveredByOverlay,
} from "../../../lib/walkthrough";
import {
  overlayInitial,
  overlayAnimate,
  overlayExit,
  overlayTransition,
  checkmarkInitial,
  checkmarkAnimate,
  checkmarkTransition,
  arrowAnimationConfig,
  arrowAnimations,
} from "@/lib/animations/walkthrough-overlay-animation";

// Export collision check function to be called from canvas-content's onMove
export const checkCircleCollision = (
  rfInstance: ReturnType<typeof useFlowStore.getState>["rfInstance"]
) => {
  if (!rfInstance) return;

  const nodes = useFlowStore.getState().nodes;
  const circleNodes = nodes.filter(
    (n) => n.type === "walkthrough-purple-circle"
  );

  if (circleNodes.length === 0) {
    return;
  }

  const overlayCenter = getOverlayCenter();
  const updateNodeData = useFlowStore.getState().updateNodeData;

  // Check each circle node for collision
  circleNodes.forEach((circleNode) => {
    // Prevent multiple triggers - check if node is already being deleted
    if (circleNode.data?.isDeleting) {
      return;
    }

    // Convert circle node position from flow to screen coordinates
    const nodeScreenPos = rfInstance.flowToScreenPosition(circleNode.position);
    const nodeWidth = circleNode.width || 60;
    const nodeHeight = circleNode.height || 60;
    const nodeCenterScreenPos = {
      x: nodeScreenPos.x + nodeWidth / 2,
      y: nodeScreenPos.y + nodeHeight / 2,
    };

    // Check if entire node (including all corners) is completely inside overlay
    const isCovered = isNodeCoveredByOverlay(
      nodeCenterScreenPos,
      nodeWidth,
      nodeHeight,
      overlayCenter,
      OVERLAY_RADIUS
    );

    if (isCovered) {
      // Mark ONLY purple circle node as deleting to trigger exit animation
      // Other nodes delete immediately without animation
      updateNodeData(circleNode.id, { isDeleting: true });
    }
  });
};

const CircleOverlay = () => {
  const nodes = useFlowStore((state) => state.nodes);
  const hasSeenCirclesRef = useRef(false);
  const hasAdvancedStepRef = useRef(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStep1Active = useIsStepActive(1);
  const [shouldRender, setShouldRender] = useState(true);
  const isSkipping = useIsSkipping();

  // Check if all purple circles have been deleted
  const allCirclesConsumed = useMemo(() => {
    const circleNodes = nodes.filter(
      (n) => n.type === "walkthrough-purple-circle"
    );

    // Track if we've ever seen circles exist
    if (circleNodes.length > 0) {
      hasSeenCirclesRef.current = true;
    }

    // Only return true if we've seen circles before AND they're all gone now
    return hasSeenCirclesRef.current && circleNodes.length === 0;
  }, [nodes]);

  // Trigger exit when all circles are consumed
  useEffect(() => {
    if (!isStep1Active || !allCirclesConsumed || hasAdvancedStepRef.current) {
      return;
    }

    // Double-check that step 1 is not already completed
    const storeState = useWalkthroughStore.getState();
    if (storeState.stepCompleted[1]) {
      hasAdvancedStepRef.current = true;
      return;
    }

    // Mark that we're starting the exit process
    hasAdvancedStepRef.current = true;

    // Wait for checkmark to appear, then trigger exit animation
    exitTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
    }, 800); // Wait 800ms for checkmark to be visible before exiting

    // Cleanup timeout if component unmounts or conditions change
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, [allCirclesConsumed, isStep1Active]);

  // Reset state when step 1 becomes active again (only when coming from another step)
  useEffect(() => {
    if (isStep1Active) {
      const storeState = useWalkthroughStore.getState();
      // Only reset if step 1 is not completed AND we haven't started the exit process
      // This prevents resetting during the normal exit flow
      if (
        !storeState.stepCompleted[1] &&
        !hasAdvancedStepRef.current &&
        !allCirclesConsumed
      ) {
        // Step 1 is active but not completed and no exit in progress, reset everything
        hasSeenCirclesRef.current = false;
        if (!shouldRender) {
          setShouldRender(true);
        }
      }
      // Reset hasAdvancedStepRef when coming back to step 1 from another step (step was completed)
      if (storeState.stepCompleted[1] && storeState.currentStep === 1) {
        hasAdvancedStepRef.current = false;
        hasSeenCirclesRef.current = false;
        if (!shouldRender) {
          setShouldRender(true);
        }
      }
    }
  }, [isStep1Active, shouldRender, allCirclesConsumed]);

  // Handle skip trigger - exit overlay when skipping
  useEffect(() => {
    if (
      isSkipping &&
      isStep1Active &&
      shouldRender &&
      !hasAdvancedStepRef.current
    ) {
      // Mark that we're starting the exit process
      hasAdvancedStepRef.current = true;
      // Trigger exit animation
      setShouldRender(false);
    }
  }, [isSkipping, isStep1Active, shouldRender]);

  // Handle exit completion - advance to next step after animation
  const handleExitComplete = () => {
    if (hasAdvancedStepRef.current) {
      const storeState = useWalkthroughStore.getState();
      // Only call nextStep if not skipping (skip handler already calls skipStep)
      // Don't check stepCompleted because nextStep() handles that internally
      if (!storeState.isSkipping) {
        storeState.nextStep();
      }
    }
  };

  // Use faster transition when skipping (200ms), otherwise use normal transition (500ms)
  const overlayExitTransition = isSkipping
    ? {
        duration: 0.2,
        ease: "easeOut" as const,
      }
    : overlayTransition;

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {shouldRender && (
        <motion.div
          key="circle-overlay-step-1"
          className="fixed top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
          initial={overlayInitial}
          animate={overlayAnimate}
          exit={overlayExit}
          transition={overlayExitTransition}
        >
          {/* Circle */}
          <div className="size-44 border border-node-selected-border rounded-full bg-accent/20 flex items-center justify-center">
            {/* completion status check mark - only show when all circles are consumed */}
            <AnimatePresence>
              {allCirclesConsumed && (
                <motion.div
                  className="size-10 bg-success/20 rounded-full flex items-center justify-center"
                  initial={checkmarkInitial}
                  animate={checkmarkAnimate}
                  transition={checkmarkTransition}
                >
                  <CheckIcon className="size-6 text-success mt-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Arrow icons positioned around the circle */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -left-8"
            animate={arrowAnimations.left}
            transition={arrowAnimationConfig}
          >
            <Image
              src={ArrowLeftIcon}
              alt="left"
              width={20}
              height={20}
              className="brightness-0 invert"
            />
          </motion.div>
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 -right-8"
            animate={arrowAnimations.right}
            transition={arrowAnimationConfig}
          >
            <Image
              src={ArrowRightIcon}
              alt="right"
              width={20}
              height={20}
              className="brightness-0 invert"
            />
          </motion.div>
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -top-8"
            animate={arrowAnimations.top}
            transition={arrowAnimationConfig}
          >
            <Image
              src={ArrowCloseIcon}
              alt="top"
              width={20}
              height={20}
              className="brightness-0 invert"
            />
          </motion.div>
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -bottom-8"
            animate={arrowAnimations.bottom}
            transition={arrowAnimationConfig}
          >
            <Image
              src={ArrowOpenIcon}
              alt="bottom"
              width={20}
              height={20}
              className="brightness-0 invert"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CircleOverlay;
