"use client";

import React, { useMemo, useCallback } from "react";
import useFlowStore from "../../../stores/canvas-store";
import useConfigStore from "../../../stores/config-store";
import SettingDetailWrapper from "./setting-detail-wrapper";
import { AnimatePresence, motion } from "motion/react";

const SettingsPanel = React.memo(() => {
  const selectedNodeId = useConfigStore((state) => state.selectedNodeId);

  // Reconcile selection sources:
  // - Prefer React Flow selected flag when available (undo/redo and other internal flows)
  // - Fallback to UI store selection when React Flow temporarily reports no selection
  const selectedNode = useFlowStore(
    useCallback((state) => {
      const reactFlowSelected = state.nodes.find((n) => n.selected);
      const uiSelected = selectedNodeId
        ? state.nodes.find((n) => n.id === selectedNodeId)
        : null;
      const selected = reactFlowSelected ?? uiSelected;

      return selected?.type === "ai-image-upscaler-node-prototype" ||
        selected?.type === "face-swap-node-prototype" ||
        selected?.type === "video-generator-node-prototype"
        ? selected
        : null;
    }, [selectedNodeId])
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
