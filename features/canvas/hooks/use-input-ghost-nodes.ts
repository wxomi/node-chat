import { useState, useMemo, useCallback, useEffect } from "react";
import useFlowStore from "../stores/canvas-store";
import { getInputGhostNodes } from "../constants/nodes/ghost-nodes-config";
import { getNodeFlowConfig } from "../constants/nodes/preview-nodes";
import { NodeFlowConfig } from "../types/sidebar.types";

type InputGhostNodeHookProps = {
  nodeType: string;
  nodeId: string;
  flowConfig: NodeFlowConfig | null;
  edges: any[];
};

type SuggestionToRender = {
  suggestion: any;
  targetInput?: any;
  inputIndex?: number;
};

// Cache for getNodeFlowConfig results (static config, safe to cache)
const nodeFlowConfigCache = new Map<string, any>();

// Memoize getNodeFlowConfig calls
const getCachedNodeFlowConfig = (nodeType: string) => {
  if (!nodeFlowConfigCache.has(nodeType)) {
    nodeFlowConfigCache.set(nodeType, getNodeFlowConfig(nodeType));
  }
  return nodeFlowConfigCache.get(nodeType);
};

// Priority order for asset data types (constant)
const ASSET_DATA_TYPES = ["image", "video", "audio"] as const;

export const useInputGhostNodes = ({
  nodeType,
  nodeId,
  flowConfig,
  edges,
}: InputGhostNodeHookProps) => {
  const [isInputGhostHovered, setIsInputGhostHovered] = useState(false);
  const [isInputGhostContainerHovered, setIsInputGhostContainerHovered] =
    useState(false);

  // Reset hover states when nodeId changes
  useEffect(() => {
    setIsInputGhostHovered(false);
    setIsInputGhostContainerHovered(false);
  }, [nodeId, nodeType]);

  // Memoize connected input handles as a Set for O(1) lookup
  const connectedInputHandles = useMemo(() => {
    const connected = new Set<string>();
    edges.forEach((edge) => {
      if (edge.target === nodeId) {
        connected.add(edge.targetHandle);
      }
    });
    return connected;
  }, [edges, nodeId]);

  // Check if this node has any unconnected inputs (optimized with Set lookup)
  const hasUnconnectedInputs = useMemo(() => {
    if (!flowConfig?.inputs) return false;
    return flowConfig.inputs.some(
      (input) => !connectedInputHandles.has(input.id)
    );
  }, [flowConfig?.inputs, connectedInputHandles]);

  // Get suggestions to render (optimized)
  const suggestionsToRender = useMemo((): SuggestionToRender[] => {
    if (!flowConfig || !hasUnconnectedInputs) {
      return [];
    }

    // Get all unconnected inputs (single pass)
    const unconnectedInputs =
      flowConfig.inputs?.filter(
        (input: any) => !connectedInputHandles.has(input.id)
      ) || [];

    if (unconnectedInputs.length === 0) {
      return [];
    }

    // Get all ghost node suggestions (only when we have unconnected inputs)
    const allSuggestions = getInputGhostNodes(
      nodeType,
      flowConfig,
      nodeId,
      edges,
      useFlowStore.getState().nodes
    );

    if (allSuggestions.length === 0) {
      return [];
    }

    // Separate single-upload-node suggestions from other suggestions
    const singleUploadSuggestions: any[] = [];
    const otherSuggestions: any[] = [];
    for (const suggestion of allSuggestions) {
      if (suggestion.nodeType === "single-upload-node") {
        singleUploadSuggestions.push(suggestion);
      } else {
        otherSuggestions.push(suggestion);
      }
    }

    const suggestions: SuggestionToRender[] = [];

    // Handle single-upload-node suggestions: create one per unconnected asset input
    // Each suggestion from getInputGhostNodes corresponds to one unconnected asset input
    if (singleUploadSuggestions.length > 0) {
      // Get unconnected asset inputs (image, video, audio)
      const unconnectedAssetInputs: any[] = [];
      for (const input of unconnectedInputs) {
        if (ASSET_DATA_TYPES.includes(input.dataType as any)) {
          unconnectedAssetInputs.push(input);
        }
      }

      // Sort by actual input handle order (not by dataType priority)
      // This ensures suggestions align with their corresponding handles from top to bottom
      unconnectedAssetInputs.sort((a, b) => {
        const aIndex =
          flowConfig.inputs?.findIndex((inp: any) => inp.id === a.id) ?? 0;
        const bIndex =
          flowConfig.inputs?.findIndex((inp: any) => inp.id === b.id) ?? 0;
        return aIndex - bIndex;
      });

      // Helper function to map dataType to specific upload title
      const getUploadTitle = (dataType: string): string => {
        switch (dataType) {
          case "image":
            return "Upload Image";
          case "video":
            return "Upload Video";
          case "audio":
            return "Upload Audio";
          default:
            return "Upload Media";
        }
      };

      // Match each single-upload-node suggestion to an unconnected asset input
      // getInputGhostNodes already returns one suggestion per unconnected asset input
      for (
        let i = 0;
        i < singleUploadSuggestions.length && i < unconnectedAssetInputs.length;
        i++
      ) {
        const suggestion = singleUploadSuggestions[i];
        const assetInput = unconnectedAssetInputs[i];
        const inputIndex =
          flowConfig.inputs?.findIndex(
            (inp: any) => inp.id === assetInput.id
          ) ?? 0;

        // Calculate yOffset to align with the input handle position
        // Handles use baseOffset=50 and spacing=40, so position = 50 + 40*index
        // Ghost node container is centered (top-1/2), so center is ~200px (minHeight 400px / 2)
        // yOffset = handlePosition - centerPosition = (50 + 40*index) - 200
        const handleBaseOffset = 50;
        const handleSpacing = 40;
        const ghostContainerCenter = 200; // Approximate center of minHeight 400px
        const calculatedYOffset =
          handleBaseOffset + handleSpacing * inputIndex - ghostContainerCenter;

        suggestions.push({
          suggestion: {
            ...suggestion,
            title: getUploadTitle(assetInput.dataType),
            yOffset: calculatedYOffset,
          },
          targetInput: assetInput,
          inputIndex,
        });
      }
    }

    // Handle other suggestions: match to unconnected inputs
    // Pre-compute input index map for O(1) lookup
    const inputIndexMap = new Map<string, number>();
    flowConfig.inputs?.forEach((input: any, index: number) => {
      inputIndexMap.set(input.id, index);
    });

    // Pre-compute suggestion output data types (cache config lookups)
    const suggestionOutputMap = new Map<string, string>();
    for (const suggestion of otherSuggestions) {
      if (!suggestionOutputMap.has(suggestion.nodeType)) {
        const sourceFlowConfig = getCachedNodeFlowConfig(suggestion.nodeType);
        const outputDataType = sourceFlowConfig?.outputs?.[0]?.dataType;
        if (outputDataType) {
          suggestionOutputMap.set(suggestion.nodeType, outputDataType);
        }
      }
    }

    // Match suggestions to inputs (optimized with maps)
    for (const input of unconnectedInputs) {
      for (const suggestion of otherSuggestions) {
        const sourceOutputDataType = suggestionOutputMap.get(
          suggestion.nodeType
        );
        if (sourceOutputDataType === input.dataType) {
          const inputIndex = inputIndexMap.get(input.id) ?? -1;

          // Calculate yOffset to align with the input handle position
          // Handles use baseOffset=50 and spacing=40, so position = 50 + 40*index
          // Ghost node container is centered (top-1/2), so center is ~200px (minHeight 400px / 2)
          // yOffset = handlePosition - centerPosition = (50 + 40*index) - 200
          const handleBaseOffset = 50;
          const handleSpacing = 40;
          const ghostContainerCenter = 200; // Approximate center of minHeight 400px
          const calculatedYOffset =
            inputIndex >= 0
              ? handleBaseOffset +
                handleSpacing * inputIndex -
                ghostContainerCenter
              : suggestion.yOffset;

          suggestions.push({
            suggestion: {
              ...suggestion,
              yOffset: calculatedYOffset,
            },
            targetInput: input,
            inputIndex,
          });
        }
      }
    }

    // Deduplicate by suggestion type and target input
    // For single-upload-node, we want one per unconnected asset input (by targetInput.id)
    // For other suggestions, deduplicate by nodeType-title
    const seen = new Set<string>();
    return suggestions.filter((item) => {
      let key: string;
      if (
        item.suggestion.nodeType === "single-upload-node" &&
        item.targetInput
      ) {
        // For single-upload-node, use targetInput.id to allow multiple instances
        key = `${item.suggestion.nodeType}-${item.targetInput.id}`;
      } else {
        // For other suggestions, use nodeType-title
        key = `${item.suggestion.nodeType}-${item.suggestion.title}`;
      }
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [
    nodeType,
    nodeId,
    flowConfig,
    edges,
    connectedInputHandles,
    hasUnconnectedInputs,
  ]);

  // Handler for adding node before
  const handleAddNodeBefore = useCallback(
    (
      suggestionNodeType: string,
      yOffset: number,
      inputIndex: number,
      targetInputHandleId?: string,
      targetInputDataType?: string
    ) => {
      useFlowStore
        .getState()
        .addNodeBefore(
          suggestionNodeType,
          nodeId,
          -800,
          inputIndex === 0 ? yOffset : yOffset + 500 * inputIndex,
          targetInputHandleId,
          targetInputDataType
        );
    },
    [nodeId]
  );

  return {
    isInputGhostHovered,
    setIsInputGhostHovered,
    isInputGhostContainerHovered,
    setIsInputGhostContainerHovered,
    hasUnconnectedRequiredInputs: hasUnconnectedInputs, // Keep old name for backward compatibility
    suggestionsToRender,
    handleAddNodeBefore,
  };
};
