"use client";

import React, { useEffect, useRef } from "react";
import useFlowStore from "../../../stores/canvas-store";
import { useIsStepActive } from "../../../stores/walkthrough-store";
import { getPurpleCirclePositions } from "../../../lib/walkthrough";

const PurpleCircles: React.FC = () => {
  const rfInstance = useFlowStore((state) => state.rfInstance);
  const addNode = useFlowStore((state) => state.addNode);
  const hasInitializedRef = useRef<boolean>(false);
  const isStep1Active = useIsStepActive(1);

  // Add all circles as nodes on mount (only once) - only when step 1 is active
  useEffect(() => {
    if (!isStep1Active || hasInitializedRef.current || !rfInstance) return;

    const checkAndAdd = () => {
      const nodes = useFlowStore.getState().nodes;

      // Calculate positions based on initial viewport size
      const configs = getPurpleCirclePositions(
        window.innerWidth,
        window.innerHeight
      );

      // Add each circle if it doesn't exist
      // Note: addNode generates its own ID, so we check by type and number instead
      configs.forEach((config) => {
        const exists = nodes.find(
          (n) =>
            n.type === "walkthrough-purple-circle" &&
            n.data?.number === config.number
        );
        if (!exists) {
          addNode("walkthrough-purple-circle", config.position, {
            number: config.number,
          });
        }
      });

      hasInitializedRef.current = true;
    };

    // Small delay to ensure ReactFlow is fully initialized
    const timeout = setTimeout(checkAndAdd, 100);

    return () => clearTimeout(timeout);
  }, [addNode, rfInstance, isStep1Active]);

  // Early return if step 1 is not active
  if (!isStep1Active) {
    return null;
  }

  return null;
};

export default PurpleCircles;
