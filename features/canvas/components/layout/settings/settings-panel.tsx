"use client";

import React, { useMemo, useCallback } from "react";
import useFlowStore from "../../../stores/canvas-store";
import SettingDetailWrapper from "./setting-detail-wrapper";
import { AnimatePresence, motion } from "motion/react";

const SettingsPanel = React.memo(() => {
  // Optimize subscription - only get selected node if it matches type
  const selectedNode = useFlowStore(
    useCallback((state) => {
      const selected = state.nodes.find((n) => n.selected);
      return selected?.type === "ai-image-upscaler-node-prototype" ||
        selected?.type === "face-swap-node-prototype" ||
        selected?.type === "video-generator-node-prototype"
        ? selected
        : null;
    }, [])
  );

  // Memoize isOpen calculation
  const isOpen = useMemo(() => !!selectedNode, [selectedNode]);

  return (
    <AnimatePresence mode="wait">
      {isOpen && selectedNode && (
        <motion.div
          className="absolute top-40 right-4 z-[100]"
          initial={{ x: 400 }}
          animate={{ x: 0 }}
          exit={{ x: 400 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
            mass: 1.2,
          }}
        >
          <SettingDetailWrapper nodeId={selectedNode.id} />
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SettingsPanel.displayName = "SettingsPanel";

export default SettingsPanel;
