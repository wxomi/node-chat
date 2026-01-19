import { useState, useMemo, useCallback, useEffect } from "react";
import useFlowStore from "../stores/canvas-store";
import { getGhostNodes } from "../constants/nodes/ghost-nodes-config";
import { NodeFlowConfig } from "../types/sidebar.types";

type OutputGhostNodeHookProps = {
  nodeType: string;
  nodeId: string;
  flowConfig: NodeFlowConfig | null;
  edges: any[];
};

export const useOutputGhostNodes = ({
  nodeType,
  nodeId,
  flowConfig,
  edges,
}: OutputGhostNodeHookProps) => {
  const [isOutputGhostHovered, setIsOutputGhostHovered] = useState(false);
  const [isOutputGhostContainerHovered, setIsOutputGhostContainerHovered] =
    useState(false);

  // Reset hover states when nodeId changes
  useEffect(() => {
    setIsOutputGhostHovered(false);
    setIsOutputGhostContainerHovered(false);
  }, [nodeId, nodeType]);

  // Check if this node is the last in workflow (has outputs but no outgoing edges)
  const isLastInWorkflow = useMemo(() => {
    if (!flowConfig?.outputs || flowConfig.outputs.length === 0) {
      return false;
    }

    const hasOutgoingEdges = flowConfig.outputs.some((output) =>
      edges.some(
        (edge) => edge.source === nodeId && edge.sourceHandle === output.id
      )
    );

    return !hasOutgoingEdges;
  }, [edges, flowConfig?.outputs, nodeId]);

  // Get suggestions to render (only when node is last in workflow)
  const suggestionsToRender = useMemo(() => {
    if (!isLastInWorkflow || !flowConfig) {
      return [];
    }

    return getGhostNodes(nodeType, flowConfig);
  }, [nodeType, flowConfig, isLastInWorkflow]);

  // Handler for adding node after
  const handleAddNodeAfter = useCallback(
    (suggestionNodeType: string, yOffset: number) => {
      useFlowStore
        .getState()
        .addNodeAfter(suggestionNodeType, nodeId, 800, yOffset);
    },
    [nodeId]
  );

  return {
    isOutputGhostHovered,
    setIsOutputGhostHovered,
    isOutputGhostContainerHovered,
    setIsOutputGhostContainerHovered,
    isLastInWorkflow,
    suggestionsToRender,
    handleAddNodeAfter,
  };
};
