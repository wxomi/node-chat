"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  useIsStepActive,
  useIsSkipping,
} from "../../../stores/walkthrough-store";
import { motion, AnimatePresence } from "motion/react";
import useFlowStore from "../../../stores/canvas-store";
import useWalkthroughStore from "../../../stores/walkthrough-store";
import { CheckIcon } from "lucide-react";
import {
  overlayInitial,
  overlayAnimate,
  overlayExit,
  overlayTransition,
  checkmarkInitial,
  checkmarkAnimate,
  checkmarkTransition,
} from "@/lib/animations/walkthrough-overlay-animation";
// No longer need collision detection - success triggers on any drop

const DropZone = () => {
  const isStep4Active = useIsStepActive(4);
  const rfInstance = useFlowStore((state) => state.rfInstance);
  const addNode = useFlowStore((state) => state.addNode);
  const nodes = useFlowStore((state) => state.nodes);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const hasAdvancedStepRef = useRef(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSkipping = useIsSkipping();
  const initialNodeCountRef = useRef<number>(0);
  const hasInitializedRef = useRef(false); // Track if we've initialized the count

  // No collision detection needed - success triggers on any drop

  // Reset state when step 4 becomes inactive
  useEffect(() => {
    if (!isStep4Active) {
      setIsSuccess(false);
      setShouldRender(true);
      hasAdvancedStepRef.current = false;
      initialNodeCountRef.current = 0;
      hasInitializedRef.current = false;
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    }
  }, [isStep4Active]);

  // Track initial count of image-generator nodes when step 4 becomes active
  useEffect(() => {
    if (isStep4Active && !hasInitializedRef.current) {
      const imageGeneratorNodes = nodes.filter(
        (n) => n.type === "image-generator-node"
      );
      initialNodeCountRef.current = imageGeneratorNodes.length;
      hasInitializedRef.current = true;
    } else if (!isStep4Active) {
      initialNodeCountRef.current = 0;
      hasInitializedRef.current = false;
    }
  }, [isStep4Active, nodes]);

  // Detect when image-generator-node is added
  useEffect(() => {
    if (!isStep4Active || isSuccess) {
      return;
    }

    const imageGeneratorNodes = nodes.filter(
      (n) => n.type === "image-generator-node"
    );
    const currentCount = imageGeneratorNodes.length;

    if (currentCount > initialNodeCountRef.current) {
      setIsSuccess(true);
    }
  }, [nodes, isStep4Active, isSuccess]);

  // Trigger exit when success is achieved
  useEffect(() => {
    if (!isSuccess || hasAdvancedStepRef.current) {
      return;
    }

    const storeState = useWalkthroughStore.getState();

    if (storeState.stepCompleted[4]) {
      hasAdvancedStepRef.current = true;
      return;
    }

    hasAdvancedStepRef.current = true;

    exitTimeoutRef.current = setTimeout(() => {
      setShouldRender(false);
    }, 800);

    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
        exitTimeoutRef.current = null;
      }
    };
  }, [isSuccess]);

  // Handle skip trigger - exit drop zone when skipping
  useEffect(() => {
    if (
      isSkipping &&
      isStep4Active &&
      shouldRender &&
      !hasAdvancedStepRef.current
    ) {
      hasAdvancedStepRef.current = true;
      setShouldRender(false);
    }
  }, [isSkipping, isStep4Active, shouldRender]);

  // Handle exit completion - advance to next step after animation
  const handleExitComplete = () => {
    if (hasAdvancedStepRef.current) {
      const storeState = useWalkthroughStore.getState();
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

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      if (!isStep4Active || !rfInstance) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const type = event.dataTransfer.getData("application/reactflow");

      if (type !== "image-generator-node") {
        return;
      }

      const flowPosition = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(type, flowPosition);
    },
    [isStep4Active, rfInstance, addNode]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      if (!isStep4Active) return;

      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "move";
    },
    [isStep4Active]
  );

  if (!isStep4Active) {
    return null;
  }

  return (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {shouldRender && (
        <motion.div
          key="drop-zone-step-4"
          className="fixed top-1/2 left-1/2 z-[60] pointer-events-auto translate-x-[200px] translate-y-[-300px]"
          initial={overlayInitial}
          animate={overlayAnimate}
          exit={overlayExit}
          transition={overlayExitTransition}
        >
          <div className="w-[400px] h-[500px] border border-node-selected-border rounded-sm bg-accent/20 flex items-center justify-center relative">
            {/* Success checkmark */}
            <AnimatePresence mode="popLayout">
              {!isSuccess ? (
                <motion.div
                  key="drop-indicator"
                  className="text-xs text-muted-foreground text-center px-2"
                  initial={checkmarkInitial}
                  animate={checkmarkAnimate}
                  exit={checkmarkInitial}
                  transition={checkmarkTransition}
                >
                  Drop Image Generator Here
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
          </div>
          {/* Invisible drop zone overlay for event handling */}
          <div
            className="absolute inset-0"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DropZone;
