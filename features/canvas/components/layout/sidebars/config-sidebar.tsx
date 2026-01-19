"use client";

import React, { useMemo } from "react";
import useFlowStore from "../../../stores/canvas-store";
import useConfigStore from "../../../stores/config-store";
import { BATCHABLE_NODE_TYPES } from "../../../constants/batch/batch-config-constants";
import ImageGeneratorConfigSheet from "../../config/image-generator-config-sheet";
import AIImageEditorConfigSheet from "../../config/ai-image-editor-config-sheet";
import AIImageUpscalerConfigSheet from "../../config/ai-image-upscaler-config-sheet";
import FaceSwapConfigSheet from "../../config/face-swap-config-sheet";
import VideoGeneratorConfigSheet from "../../config/video-generator-config-sheet";
import AnimationConfigSheet from "../../config/animation-config-sheet";
import FaceSwapVideoConfigSheet from "../../config/face-swap-video-config-sheet";
import LipSyncConfigSheet from "../../config/lip-sync-config-sheet";
import AIVoiceGeneratorConfigSheet from "../../config/ai-voice-generator-config-sheet";
import BatchConfigSheet from "../../config/batch-config-sheet";

const ConfigSidebar = () => {
  const selectedNodeId = useConfigStore((state) => state.selectedNodeId);
  const nodes = useFlowStore((state) => state.nodes);

  // Get all selected nodes from React Flow's selected property
  const selectedNodes = useMemo(() => {
    return nodes.filter((node) => node.selected === true);
  }, [nodes]);

  const selectedNodeIds = selectedNodes.map((node) => node.id);
  const isMultipleSelected = selectedNodeIds.length > 1;
  const isSingleSelected = selectedNodeIds.length === 1;

  // For single node, get the node for individual config sheet routing
  const selectedNode = isSingleSelected ? selectedNodes[0] : null;

  // Check if at least one selected node is batchable
  const hasBatchableNodes = selectedNodes.some(
    (node) => node.type && BATCHABLE_NODE_TYPES.includes(node.type)
  );

  // Filter to only batchable node IDs for batch config sheet
  const batchableNodeIds = useMemo(() => {
    return selectedNodeIds.filter((id) => {
      const node = selectedNodes.find((n) => n.id === id);
      return node?.type && BATCHABLE_NODE_TYPES.includes(node.type);
    });
  }, [selectedNodeIds, selectedNodes]);

  // Gate: only show if there are selected nodes with config options (for individual sheets) or batchable nodes (for batch sheet)
  const isOpen =
    (isSingleSelected && selectedNode?.data?.configOptions === true) ||
    (isMultipleSelected && hasBatchableNodes);

  // Router: determine which config sheet to show
  const renderConfigSheet = () => {
    if (!isOpen) {
      return null;
    }

    // Show batch config sheet for multiple selections (if at least one is batchable)
    if (isMultipleSelected && hasBatchableNodes) {
      return <BatchConfigSheet selectedNodeIds={batchableNodeIds} />;
    }

    // Show individual config sheets for single selection
    if (isSingleSelected && selectedNode) {
      // Gate: only show if configOptions === true
      const hasConfigOptions = selectedNode?.data?.configOptions === true;

      if (!hasConfigOptions) {
        return null;
      }

      switch (selectedNode?.type) {
        case "ai-image-editor-node":
          return <AIImageEditorConfigSheet nodeId={selectedNodeIds[0]} />;
        case "ai-image-upscaler-node":
          return <AIImageUpscalerConfigSheet nodeId={selectedNodeIds[0]} />;
        case "face-swap-node":
          return <FaceSwapConfigSheet nodeId={selectedNodeIds[0]} />;
        case "video-generator-node":
          return <VideoGeneratorConfigSheet nodeId={selectedNodeIds[0]} />;
        case "animation-node":
          return <AnimationConfigSheet nodeId={selectedNodeIds[0]} />;
        case "face-swap-video-node":
          return <FaceSwapVideoConfigSheet nodeId={selectedNodeIds[0]} />;
        case "lip-sync-node":
          return <LipSyncConfigSheet nodeId={selectedNodeIds[0]} />;
        case "ai-voice-generator-node":
          return <AIVoiceGeneratorConfigSheet nodeId={selectedNodeIds[0]} />;
        default:
          return null;
      }
    }

    return null;
  };

  return (
    <aside
      className="fixed top-0 h-screen w-[280px] bg-sidebar-background border-l border-sidebar-border z-50 transition-all duration-200 ease-in-out flex flex-col"
      style={{
        right: isOpen ? "0px" : "-280px",
        opacity: isOpen ? 1 : 0,
        pointerEvents: isOpen ? "auto" : "none",
      }}
    >
      {renderConfigSheet()}
    </aside>
  );
};

export default ConfigSidebar;
