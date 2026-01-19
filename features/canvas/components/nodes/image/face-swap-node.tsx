"use client";

import React, { useState, useCallback, useEffect, memo, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUpdateNodeInternals } from "@xyflow/react";
import useFlowStore from "../../../stores/canvas-store";
import useConfigStore from "../../../stores/config-store";
import { cn } from "@/lib/utils";
import { NodeFlowConfig } from "../../../types/sidebar.types";
import CustomHandle from "../../shared/connections/custom-handle";
import { NodeAnimation } from "@/lib/animations/node-animation";
import GenerateButton, {
  type ButtonState,
} from "../../shared/generate-button/generate-button";
import ImageDialog from "../../shared/dialogs/image-dialog";
import ImagePreview from "../../shared/assets/image-preview";
import { type ImageDetails } from "../../../lib/image";
import { handleFaceSwap } from "../../../handlers/image";
import ConnectedAssetDisplay from "../../shared/assets/connected-asset-display";
import type { FaceSwapNodeConfig } from "../../../validations/image";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";
import { useNodeHoverState } from "../../../hooks/use-node-hover-state";
import InputGhostNodeSuggestions from "../../shared/ghost-nodes/input-ghost-node-suggestions";
import OutputGhostNodeSuggestions from "../../shared/ghost-nodes/output-ghost-node-suggestions";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
  getImagePreviewDimensions,
  getDimensionsFromSource,
  calculateCustomContainerDimensions,
} from "../../../lib/shared";
import { getOrientationFromSource } from "../../../lib/shared/orientation-propagation";

type FaceSwapNodeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const FaceSwapNode: React.FC<FaceSwapNodeProps> = memo(
  ({ id, selected, dragging }) => {
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const updateNodeInternals = useUpdateNodeInternals();
    const setSelectedNodeId = useConfigStore(
      (state) => state.setSelectedNodeId
    );

    const {
      isNodeHovered,
      setIsNodeHovered,
      isGhostHovered,
      setIsGhostHovered,
      isGhostContainerHovered,
      setIsGhostContainerHovered,
      isInputGhostHovered,
      setIsInputGhostHovered,
      isHovered,
    } = useNodeHoverState();

    // Only subscribe to node DATA, not position changes
    const nodeData = useFlowStore((s) => {
      const node = s.nodes.find((n) => n.id === id);
      return node?.data;
    });

    const imageSource = useConfigStore(
      (state) =>
        (state.nodeConfigs?.[id] as FaceSwapNodeConfig | undefined)?.assets
          ?.imageSource || "file"
    );

    const youtubeUrl = useConfigStore(
      (state) =>
        (state.nodeConfigs?.[id] as FaceSwapNodeConfig | undefined)?.assets
          ?.youtubeUrl
    );

    const edges = useFlowStore((s) => s.edges);
    const nodeConfig = useConfigStore(
      (state) => state.nodeConfigs?.[id] as FaceSwapNodeConfig | undefined
    );
    const nodeConfigs = useConfigStore((state) => state.nodeConfigs);

    // Memoize flowConfig
    const flowConfig = useMemo(
      () => nodeData?.flowConfig as NodeFlowConfig | null,
      [nodeData?.flowConfig]
    );

    // Get node disabled state based on connection compatibility
    const { isNodeDisabled } = useNodeDisabledState({
      nodeId: id,
      flowConfig,
    });

    // Memoize isRequired
    const isRequired = useMemo(
      () => flowConfig?.inputs.some((input) => input.required),
      [flowConfig]
    );

    // Memoize connected assets to prevent constant recomputation
    const connectedAssets = useMemo(() => {
      const assets: Record<string, any> = {};

      flowConfig?.inputs.forEach((input) => {
        const connectedEdge = edges.find(
          (edge) => edge.target === id && edge.targetHandle === input.id
        );

        if (connectedEdge) {
          const sourceNode = useFlowStore
            .getState()
            .nodes.find((n) => n.id === connectedEdge.source);
          if (sourceNode?.data?.uploadedAssets) {
            const asset = (sourceNode.data.uploadedAssets as any[]).find(
              (a: any) => a.id === connectedEdge.sourceHandle
            );
            assets[input.id] = asset || null;
          } else {
            assets[input.id] = null;
          }
        } else {
          assets[input.id] = null;
        }
      });

      return assets;
    }, [edges, flowConfig?.inputs, id]);

    // Extract source dimensions from connected upload node for target-face-input
    // Face swap uses target image dimensions (target determines output orientation)
    const sourceDimensions = useMemo(() => {
      const targetFaceInput = flowConfig?.inputs.find(
        (input) => input.id === "target-face-input" && input.dataType === "image"
      );
      if (!targetFaceInput) return null;

      return getDimensionsFromSource(id, targetFaceInput.id, edges);
    }, [edges, flowConfig?.inputs, id]);

    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    const isHandleDisabled = useCallback(
      (handleId: string): boolean => {
        if (
          handleId === "source-face-input" ||
          handleId === "target-face-input"
        ) {
          // Enable only when image source is file
          return imageSource !== "file";
        }
        return false;
      },
      [imageSource]
    );

    // Memoize handleNodeClick
    const handleNodeClick = useCallback(() => {
      setSelectedNodeId(id);
    }, [id, setSelectedNodeId]);

    // Memoize handleImageClick
    const handleImageClick = useCallback(() => {
      setIsImageDialogOpen(true);
    }, []);

    // Memoize imageDetails
    const imageDetails = useMemo(
      () => nodeData?.imageDetails as ImageDetails | undefined,
      [nodeData?.imageDetails]
    );

    // Memoize imageUrl
    const imageUrl = useMemo(
      () => imageDetails?.downloads?.[0]?.url,
      [imageDetails]
    );

    // Memoize isGenerating
    const isGenerating = useMemo(
      () => !!(nodeData?.generatedImageId && !imageDetails),
      [nodeData?.generatedImageId, imageDetails]
    );

    // Use stored orientation if image exists or generation is in progress, otherwise use config orientation
    // Face swap uses target-face-input for orientation (target image determines output orientation)
    const orientation = useMemo(() => {
      // If image exists or generation is in progress, use the orientation stored when generation started
      if (imageDetails || nodeData?.generatedOrientation) {
        return (nodeData?.generatedOrientation ||
          nodeConfig?.orientation ||
          "square") as "square" | "landscape" | "portrait";
      }
      // If no image and no generation in progress, use current config orientation
      return (nodeConfig?.orientation || "square") as
        | "square"
        | "landscape"
        | "portrait";
    }, [imageDetails, nodeData?.generatedOrientation, nodeConfig?.orientation]);

    // Get image preview dimensions from shared utility
    const { previewDimensionsMap, containerDimensionsMap, containerOverhead } =
      getImagePreviewDimensions();

    // Calculate custom container dimensions based on source aspect ratio
    // Only use source dimensions if generation has started (generatedOrientation exists)
    // This ensures container size only changes when generate button is clicked, not on connection
    const customContainerDimensions = useMemo(() => {
      return calculateCustomContainerDimensions(
        sourceDimensions,
        containerOverhead,
        !!nodeData?.generatedOrientation
      );
    }, [sourceDimensions, containerOverhead, nodeData?.generatedOrientation]);

    // Use custom dimensions if available, otherwise use fixed dimensions
    const finalContainerDimensions = useMemo(() => {
      return customContainerDimensions || containerDimensionsMap[orientation];
    }, [customContainerDimensions, containerDimensionsMap, orientation]);

    // Calculate preview height for ImagePreview component
    const previewHeight = useMemo(() => {
      if (customContainerDimensions) {
        return customContainerDimensions.height - containerOverhead.total;
      }
      return previewDimensionsMap[orientation].height;
    }, [
      customContainerDimensions,
      containerOverhead,
      previewDimensionsMap,
      orientation,
    ]);

    // Compute button state using utility function
    const computedButtonState = useMemo<ButtonState>(
      () =>
        computeButtonState(
          nodeData?.generatedImageId as string | undefined,
          imageDetails
        ),
      [nodeData?.generatedImageId, imageDetails]
    );

    // Apply auto-reset logic from completed to idle
    const finalButtonState = useButtonStateWithAutoReset(computedButtonState);

    // Memoize handleGenerate
    const handleGenerate = useCallback(async () => {
      await handleFaceSwap(id);
    }, [id]);

    // Calculate offset for input ghost suggestions (10px below last handle)
    const inputHandleOffset = useMemo(() => {
      if (!flowConfig?.inputs || flowConfig.inputs.length === 0)
        return undefined;
      const baseOffset = 50;
      const spacing = 40;
      const lastHandleIndex = flowConfig.inputs.length - 1;
      const lastHandlePosition = baseOffset + lastHandleIndex * spacing;
      return lastHandlePosition + 10; // 10px below last handle
    }, [flowConfig?.inputs]);

    // Calculate deadzone config (start at first handle, cover all handles + padding)
    const deadzoneConfig = useMemo(() => {
      if (!flowConfig?.inputs || flowConfig.inputs.length === 0)
        return undefined;
      return {
        offset: 120, // Start at first handle
        height: flowConfig.inputs.length * 40 + 300, // Cover all handles + padding
      };
    }, [flowConfig?.inputs]);

    // Calculate offset for output ghost suggestions (10px below last output handle)
    const outputHandleOffset = useMemo(() => {
      if (!flowConfig?.outputs || flowConfig.outputs.length === 0)
        return undefined;
      const baseOffset = 50;
      const spacing = 40;
      const lastHandleIndex = flowConfig.outputs.length - 1;
      const lastHandlePosition = baseOffset + lastHandleIndex * spacing;
      return lastHandlePosition + 10; // 10px below last handle
    }, [flowConfig?.outputs]);

    // Calculate deadzone config for output handles (start at first handle, cover all handles + padding)
    const outputDeadzoneConfig = useMemo(() => {
      if (!flowConfig?.outputs || flowConfig.outputs.length === 0)
        return undefined;
      return {
        offset: 90, // Start at first handle
        height: flowConfig.outputs.length * 40 + 300, // Cover all handles + padding
      };
    }, [flowConfig?.outputs]);

    return (
      <>
        <InputGhostNodeSuggestions
          nodeType="face-swap-node"
          nodeId={id}
          flowConfig={flowConfig}
          edges={edges}
          isHovered={isHovered}
          selected={selected}
          onHoverChange={setIsInputGhostHovered}
          onNodeHoverChange={setIsNodeHovered}
          offset={inputHandleOffset}
          deadzoneOffset={deadzoneConfig?.offset}
          deadzoneHeight={deadzoneConfig?.height}
        />

        <OutputGhostNodeSuggestions
          nodeType="face-swap-node"
          nodeId={id}
          flowConfig={flowConfig}
          edges={edges}
          isHovered={isHovered}
          selected={selected}
          onHoverChange={(isOutputGhostHovered) => {
            setIsGhostHovered(isOutputGhostHovered);
            setIsGhostContainerHovered(isOutputGhostHovered);
          }}
          onNodeHoverChange={setIsNodeHovered}
          offset={outputHandleOffset}
          deadzoneOffset={outputDeadzoneConfig?.offset}
          deadzoneHeight={outputDeadzoneConfig?.height}
        />

        <NodeAnimation>
          <motion.div
            className={cn(
              "bg-popover rounded-xl p-4 border border-popover cursor-pointer transition-[width,height] duration-300 ease-in-out",
              isNodeDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              borderRadius: "14px",
              width: finalContainerDimensions.width,
              height: finalContainerDimensions.height,
              ...(selected && {
                backgroundColor: "var(--node-selected)",
                borderColor: "var(--node-selected-border)",
              }),
            }}
            onMouseEnter={() => setIsNodeHovered(true)}
            onMouseLeave={() => setIsNodeHovered(false)}
            onClick={handleNodeClick}
          >
            {/* Node title */}
            <div className="text-body-desktop-medium mb-3">
              Swap Face in Image
            </div>

            {/* Memoized image preview component */}
            <ImagePreview
              imageUrl={imageUrl}
              isGenerating={isGenerating}
              onImageClick={handleImageClick}
              orientation={orientation}
              height={previewHeight}
            />

            {/* Generate button and connected assets */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-row gap-2 h-6">
                {flowConfig?.inputs.map((input) => {
                  // Special case: Show YouTube icon when YouTube is active and has URL
                  if (
                    (input.id === "source-face-input" ||
                      input.id === "target-face-input") &&
                    imageSource === "youtube" &&
                    youtubeUrl
                  ) {
                    return (
                      <ConnectedAssetDisplay
                        key={input.id}
                        connectedAsset={connectedAssets[input.id]}
                        disabled={isHandleDisabled(input.id)}
                      />
                    );
                  }

                  return (
                    <ConnectedAssetDisplay
                      key={input.id}
                      connectedAsset={connectedAssets[input.id]}
                      disabled={isHandleDisabled(input.id)}
                    />
                  );
                })}
              </div>
              <GenerateButton
                onClick={handleGenerate}
                state={finalButtonState}
                isLoading={isGenerating}
                disabled={isGenerating || isNodeDisabled}
              />
            </div>

            {/* Node handles */}
            {flowConfig?.outputs.map((output, index) => (
              <CustomHandle
                key={output.id}
                config={output}
                nodeId={id}
                index={index}
                handleType="output"
                baseOffset={50}
                spacing={40}
                labelOffsets={{
                  Image: { horizontal: "-2.5rem" },
                  Video: { horizontal: "-2.3rem" },
                }}
                onSelected={selected}
                isHovered={isHovered}
                isConnected={edges.some(
                  (edge) =>
                    edge.source === id && edge.sourceHandle === output.id
                )}
              />
            ))}

            {flowConfig?.inputs.map((input, index) => (
              <CustomHandle
                key={input.id}
                config={input}
                isRequired={isRequired}
                nodeId={id}
                index={index}
                handleType="input"
                baseOffset={50}
                spacing={40}
                labelOffsets={{
                  Image: { horizontal: "-2.5rem" },
                  "Face Image": { horizontal: "-4.4rem" },
                }}
                onSelected={selected}
                isHovered={isHovered}
                isConnected={edges.some(
                  (edge) => edge.target === id && edge.targetHandle === input.id
                )}
                disabled={isHandleDisabled(input.id)}
              />
            ))}
          </motion.div>
        </NodeAnimation>

        {/* Image Dialog */}
        <ImageDialog
          isOpen={isImageDialogOpen}
          imageUrl={imageUrl}
          onClose={() => setIsImageDialogOpen(false)}
        />
      </>
    );
  }
);

FaceSwapNode.displayName = "FaceSwapNode";

export default FaceSwapNode;
