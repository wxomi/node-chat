"use client";

import React, { useEffect, useRef } from "react";
import useFlowStore from "../../../stores/canvas-store";
import { useIsStepActive } from "../../../stores/walkthrough-store";

const WalkthroughPromptNode: React.FC = () => {
  const rfInstance = useFlowStore((state) => state.rfInstance);
  const addNode = useFlowStore((state) => state.addNode);
  const hasInitializedRef = useRef<boolean>(false);
  const isStep2Active = useIsStepActive(2);

  // Add prompt node when step 2 becomes active (only once)
  useEffect(() => {
    if (!isStep2Active || hasInitializedRef.current || !rfInstance) return;

    const checkAndAdd = () => {
      const nodes = useFlowStore.getState().nodes;

      // Check if walkthrough prompt node already exists
      const exists = nodes.find(
        (n) => n.type === "text-node" && n.data?.isWalkthroughNode === true
      );

      if (!exists) {
        // Calculate center position in screen coordinates
        const screenCenter = {
          x: window.innerWidth / 2 - 200,
          y: window.innerHeight / 2 - 300,
        };

        // Convert screen coordinates to flow coordinates
        const flowPosition = rfInstance.screenToFlowPosition(screenCenter);

        // Add the prompt node at the center
        const nodeId = addNode("text-node", flowPosition, {
          isWalkthroughNode: true,
          prompt:
            "Epic anime art of wizard casting a cosmic spell in the sky that says 'Magic Hour'.",
        });
      }

      hasInitializedRef.current = true;
    };

    // Small delay to ensure ReactFlow is fully initialized
    const timeout = setTimeout(checkAndAdd, 100);

    return () => clearTimeout(timeout);
  }, [addNode, rfInstance, isStep2Active]);

  // Early return if step 2 is not active
  if (!isStep2Active) {
    return null;
  }

  return null;
};

export default WalkthroughPromptNode;
