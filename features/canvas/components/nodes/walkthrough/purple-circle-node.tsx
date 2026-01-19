"use client";

import React, { memo, useMemo, useCallback, useState } from "react";
import { motion } from "motion/react";
import useFlowStore from "../../../stores/canvas-store";
import { useIsSkipping } from "../../../stores/walkthrough-store";
import Image from "next/image";
import magicHourLogo from "@/public/icons/magic-hour-logo.svg";

type PurpleCircleNodeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

// Purple circle node with delete animation - ONLY this node type has delete animation
// Other nodes delete immediately without animation
const PurpleCircleNode: React.FC<PurpleCircleNodeProps> = memo(
  ({ id, selected, dragging }) => {
    const deleteNode = useFlowStore((state) => state.deleteNode);
    const [isVisible, setIsVisible] = useState(true);
    const isSkipping = useIsSkipping();

    // Subscribe to node data from canvas store
    const nodeData = useFlowStore(
      useCallback((s) => s.nodes.find((n) => n.id === id)?.data ?? {}, [id])
    );

    const number = (nodeData?.number as number) ?? 1;
    // Only purple circle nodes use isDeleting flag for exit animation
    const isDeleting = (nodeData?.isDeleting as boolean) ?? false;

    // Memoize the number to avoid unnecessary re-renders
    const displayNumber = useMemo(() => number, [number]);

    // Handle exit animation completion - ONLY for purple circle nodes
    const handleAnimationComplete = useCallback(() => {
      if (isDeleting) {
        setIsVisible(false);
        // Remove node from ReactFlow after animation completes
        deleteNode(id);
      }
    }, [isDeleting, id, deleteNode]);

    // Hide component after animation completes and node is removed
    if (!isVisible) return null;

    // Use synchronized transition when skipping (matches overlay 200ms easeOut)
    // Otherwise use spring animation for natural deletion
    const exitTransition = isSkipping
      ? {
          duration: 0.2,
          ease: "easeOut" as const,
        }
      : {
          type: "spring" as const,
          stiffness: 800,
          damping: 20,
          mass: 0.5,
        };

    return (
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.85,
        }}
        animate={
          isDeleting
            ? {
                opacity: 0,
                scale: 0.85,
              }
            : {
                opacity: 1,
                scale: 1,
              }
        }
        transition={exitTransition}
        onAnimationComplete={handleAnimationComplete}
        style={{
          transformOrigin: "center center",
        }}
        className="w-[60px] h-[60px] bg-primary rounded-full flex items-center justify-center border-2 border-node-selected pointer-events-none select-none"
      >
        <Image
          src={magicHourLogo}
          alt="magic hour logo"
          width={28}
          height={28}
        />
      </motion.div>
    );
  }
);

PurpleCircleNode.displayName = "PurpleCircleNode";

export default PurpleCircleNode;
