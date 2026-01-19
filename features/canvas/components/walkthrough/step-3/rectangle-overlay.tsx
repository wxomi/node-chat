"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import useFlowStore from "../../../stores/canvas-store";
import { MouseIcon, CheckIcon } from "lucide-react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowCloseIcon,
  ArrowOpenIcon,
} from "@/constants/icons";
import {
  overlayInitial,
  overlayAnimate,
  overlayExit,
  overlayTransition,
  arrowAnimationConfig,
  arrowAnimations,
  checkmarkInitial,
  checkmarkAnimate,
  checkmarkTransition,
} from "@/lib/animations/walkthrough-overlay-animation";
import { checkPromptNodeInRectangleOverlay } from "../../../lib/walkthrough";
import useWalkthroughStore, {
  useIsStepActive,
  useIsSkipping,
} from "../../../stores/walkthrough-store";

// Track scroll wheel usage across component instances
let hasScrolledRef = { current: false };
let initialZoomRef: number | null = null;
let successCallbackRef: ((success: boolean) => void) | null = null;

// Export check function to be called from canvas-content's onMove
export const checkRectangleCoverage = (
  rfInstance: ReturnType<typeof useFlowStore.getState>["rfInstance"],
  hasScrolled: boolean = false
) => {
  if (!rfInstance) return;

  // Check if zoom has changed from initial (indicates scroll/zoom action)
  const viewport = rfInstance.getViewport();
  const currentZoom = viewport.zoom;

  if (initialZoomRef === null) {
    initialZoomRef = currentZoom;
  } else if (Math.abs(currentZoom - initialZoomRef) > 0.01) {
    // Zoom has changed significantly from initial - user has scrolled/zoomed
    if (!hasScrolledRef.current) {
      hasScrolledRef.current = true;
    }
  }

  const isCovered = checkPromptNodeInRectangleOverlay(rfInstance);
  const scrollUsed = hasScrolled || hasScrolledRef.current;

  // Notify success if scroll wheel has been used at least once AND coverage is met
  if (isCovered && scrollUsed && successCallbackRef) {
    successCallbackRef(true);
  }
};

// Diagonal arrow animations for rectangle corners
const diagonalArrowAnimations = {
  topLeft: {
    x: [0, 4, 0],
    y: [0, 4, 0],
  },
  topRight: {
    x: [0, -4, 0],
    y: [0, 4, 0],
  },
  bottomLeft: {
    x: [0, 4, 0],
    y: [0, -4, 0],
  },
  bottomRight: {
    x: [0, -4, 0],
    y: [0, -4, 0],
  },
};

const RectangleOverlay = () => {
  const rfInstance = useFlowStore((state) => state.rfInstance);
  const nodes = useFlowStore((state) => state.nodes);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const hasAdvancedStepRef = useRef(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStep3Active = useIsStepActive(3);
  const isSkipping = useIsSkipping();

  // Register success callback
  useEffect(() => {
    successCallbackRef = setIsSuccess;
    return () => {
      successCallbackRef = null;
    };
  }, []);

  // Trigger exit when success is achieved
  useEffect(() => {
    if (!isSuccess || hasAdvancedStepRef.current) {
      return;
    }

    // Double-check that step 3 is not already completed
    const storeState = useWalkthroughStore.getState();
    if (storeState.stepCompleted[3]) {
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
  }, [isSuccess]);

  // Check for prompt node coverage on zoom/scroll
  useEffect(() => {
    if (!rfInstance) return;

    const checkCoverage = () => {
      checkRectangleCoverage(rfInstance, false);
    };

    // Don't check immediately - wait for scroll
    // Check periodically to catch viewport changes
    const intervalId = setInterval(() => {
      checkCoverage();
    }, 200);

    return () => {
      clearInterval(intervalId);
    };
  }, [rfInstance, nodes]);

  // Handle skip trigger - exit overlay when skipping
  useEffect(() => {
    if (
      isSkipping &&
      isStep3Active &&
      shouldRender &&
      !hasAdvancedStepRef.current
    ) {
      // Mark that we're starting the exit process
      hasAdvancedStepRef.current = true;
      // Trigger exit animation
      setShouldRender(false);
    }
  }, [isSkipping, isStep3Active, shouldRender]);

  // Handle exit completion - advance to next step after animation
  const handleExitComplete = () => {
    if (hasAdvancedStepRef.current) {
      const storeState = useWalkthroughStore.getState();
      // Only call nextStep if not skipping (skip handler already calls skipStep)
      if (!storeState.isSkipping) {
        storeState.nextStep();
      }
    }
  };

  // Use faster transition when skipping (200ms), otherwise use normal transition (500ms)
  const overlayExitTransition = useMemo(
    () =>
      isSkipping
        ? {
            duration: 0.2,
            ease: "easeOut" as const,
          }
        : overlayTransition,
    [isSkipping]
  );

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {shouldRender && (
        <motion.div
          key="rectangle-overlay-step-3"
          className="fixed top-[45%] left-2/3 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
          initial={overlayInitial}
          animate={overlayAnimate}
          exit={overlayExit}
          transition={overlayExitTransition}
        >
          <div className="w-[500px] h-[300px] border border-node-selected-border rounded-sm bg-accent/30 flex items-center justify-center relative">
            {/* Mouse icon and checkmark with crossfade */}
            <AnimatePresence mode="popLayout">
              {!isSuccess ? (
                <motion.div
                  key="mouse-icon"
                  className="relative"
                  initial={checkmarkInitial}
                  animate={checkmarkAnimate}
                  exit={checkmarkInitial}
                  transition={checkmarkTransition}
                >
                  <motion.div
                    animate={{
                      y: [5, -5, 5],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    {/* Top arrow */}
                    <motion.div className="absolute left-1/2 -translate-x-1/2 -top-10">
                      <Image
                        src={ArrowCloseIcon}
                        alt="top"
                        width={16}
                        height={16}
                        className="brightness-0 invert"
                      />
                    </motion.div>
                    <MouseIcon className="size-10" strokeWidth={1} />
                    {/* Bottom arrow */}
                    <motion.div className="absolute left-1/2 -translate-x-1/2 -bottom-10">
                      <Image
                        src={ArrowOpenIcon}
                        alt="bottom"
                        width={16}
                        height={16}
                        className="brightness-0 invert"
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="checkmark"
                  className="size-10 bg-success/20 rounded-full flex items-center justify-center"
                  initial={checkmarkInitial}
                  animate={checkmarkAnimate}
                  exit={checkmarkInitial}
                  transition={checkmarkTransition}
                >
                  <CheckIcon className="size-6 text-success mt-0.5" />
                </motion.div>
              )}
            </AnimatePresence>
            {/* Arrow icons positioned at the corners */}
            <motion.div
              className="absolute -top-6 -left-6 -translate-x-1/2 -translate-y-1/2"
              animate={diagonalArrowAnimations.topLeft}
              transition={arrowAnimationConfig}
            >
              <Image
                src={ArrowLeftIcon}
                alt="top-left"
                width={20}
                height={20}
                className="brightness-0 invert rotate-[45deg]"
              />
            </motion.div>
            <motion.div
              className="absolute -top-6 -right-10 -translate-x-1/2 -translate-y-1/2"
              animate={diagonalArrowAnimations.topRight}
              transition={arrowAnimationConfig}
            >
              <Image
                src={ArrowRightIcon}
                alt="top-right"
                width={20}
                height={20}
                className="brightness-0 invert rotate-[-45deg]"
              />
            </motion.div>
            <motion.div
              className="absolute -bottom-6 -left-6 -translate-x-1/2 translate-y-1/2"
              animate={diagonalArrowAnimations.bottomLeft}
              transition={arrowAnimationConfig}
            >
              <Image
                src={ArrowCloseIcon}
                alt="bottom-left"
                width={20}
                height={20}
                className="brightness-0 invert rotate-[225deg]"
              />
            </motion.div>
            <motion.div
              className="absolute -bottom-6 -right-10 -translate-x-1/2 translate-y-1/2"
              animate={diagonalArrowAnimations.bottomRight}
              transition={arrowAnimationConfig}
            >
              <Image
                src={ArrowOpenIcon}
                alt="bottom-right"
                width={20}
                height={20}
                className="brightness-0 invert rotate-[320deg]"
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RectangleOverlay;
