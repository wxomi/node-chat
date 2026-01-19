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
import VideoDialog from "../../shared/dialogs/video-dialog";
import VideoPreview from "../../shared/assets/video-preview";
import MenuBar from "../../menu-bars/video-generator-menu-bar";
import { type VideoDetails } from "../../../lib/video";
import { handleGenerateVideo } from "../../../handlers/video";
import type { VideoGeneratorNodeConfig } from "../../../validations/video";
import {
  MENU_OPTION_TO_MODE_MAP,
  VIDEO_GENERATOR_MENU_OPTIONS,
  MENU_OPTION_TO_HANDLE_MAP,
} from "../../../constants/nodes/video/video-generator-modes";
import ConnectedAssetDisplay from "../../shared/assets/connected-asset-display";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";
import { useNodeHoverState } from "../../../hooks/use-node-hover-state";
import InputGhostNodeSuggestions from "../../shared/ghost-nodes/input-ghost-node-suggestions";
import OutputGhostNodeSuggestions from "../../shared/ghost-nodes/output-ghost-node-suggestions";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
  getVideoPreviewDimensions,
  getDimensionsFromSource,
  calculateCustomContainerDimensions,
} from "../../../lib/shared";

type VideoGeneratorNodeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const VideoGeneratorNode: React.FC<VideoGeneratorNodeProps> = memo(
  ({ id, selected, dragging }) => {
    const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
    const updateNodeInternals = useUpdateNodeInternals();
    const setSelectedNodeId = useConfigStore(
      (state) => state.setSelectedNodeId
    );
    const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);
    const nodeConfig = useConfigStore(
      (state) => state.nodeConfigs?.[id] as VideoGeneratorNodeConfig | undefined
    );

    const {
      isNodeHovered,
      setIsNodeHovered,
      isMenuHovered,
      setIsMenuHovered,
      isGhostHovered,
      setIsGhostHovered,
      isGhostContainerHovered,
      setIsGhostContainerHovered,
      isInputGhostHovered,
      setIsInputGhostHovered,
      isHovered,
    } = useNodeHoverState();

    // (moved below after edges/flowConfig)

    const nodeData = useFlowStore((s) => {
      const node = s.nodes.find((n) => n.id === id);
      return node?.data;
    });

    const currentMode = useConfigStore(
      (state) =>
        (state.nodeConfigs?.[id] as VideoGeneratorNodeConfig | undefined)
          ?.mode || "text-to-video"
    );

    const activeMenuOptionId = useMemo(() => {
      return Object.entries(MENU_OPTION_TO_MODE_MAP).find(
        ([_, mode]) => mode === currentMode
      )?.[0];
    }, [currentMode]);

    // Helper function to determine if a handle should be disabled
    const isHandleDisabled = useCallback(
      (handleId: string): boolean => {
        switch (currentMode) {
          case "text-to-video":
            // Disable image and video inputs
            return handleId === "image-input" || handleId === "video-input";
          case "image-to-video":
            // Disable prompt and video inputs
            return handleId === "prompt-input" || handleId === "video-input";
          case "video-to-video":
            // Disable prompt and image inputs
            return handleId === "prompt-input" || handleId === "image-input";
          default:
            return false;
        }
      },
      [currentMode]
    );

    const edges = useFlowStore((s) => s.edges);

    const flowConfig = useMemo(
      () => nodeData?.flowConfig as NodeFlowConfig | null,
      [nodeData?.flowConfig]
    );

    // Check which handles are connected
    const connectedHandles = useMemo(() => {
      return new Set(
        edges
          .filter((edge) => edge.target === id)
          .map((edge) => edge.targetHandle)
          .filter((handleId): handleId is string => !!handleId)
      );
    }, [edges, id]);

    // Filter menu options to show only those with connected handles
    const availableMenuOptions = useMemo(() => {
      return VIDEO_GENERATOR_MENU_OPTIONS.filter((option) => {
        const handleId = MENU_OPTION_TO_HANDLE_MAP[option.id];
        if (!handleId) return false;
        return connectedHandles.has(handleId);
      });
    }, [connectedHandles]);

    // Check if current mode's handle is disconnected
    const isCurrentModeHandleConnected = useMemo(() => {
      const currentHandleId =
        MENU_OPTION_TO_HANDLE_MAP[activeMenuOptionId || ""];
      if (!currentHandleId) return false;
      return connectedHandles.has(currentHandleId);
    }, [activeMenuOptionId, connectedHandles]);

    // Auto-switch to next available mode if current mode's handle is disconnected
    useEffect(() => {
      // Only switch if there are available options and current mode is disconnected
      if (
        availableMenuOptions.length > 0 &&
        !isCurrentModeHandleConnected &&
        activeMenuOptionId
      ) {
        // Switch to the first available option
        const firstAvailableOption = availableMenuOptions[0];
        const newMode = MENU_OPTION_TO_MODE_MAP[firstAvailableOption.id];
        if (newMode) {
          updateNodeConfig(id, { mode: newMode });
        }
      }
    }, [
      availableMenuOptions,
      isCurrentModeHandleConnected,
      activeMenuOptionId,
      id,
      updateNodeConfig,
    ]);

    // Get node disabled state based on connection compatibility
    const { isNodeDisabled } = useNodeDisabledState({
      nodeId: id,
      flowConfig,
    });

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

    // Extract source dimensions from connected upload node or other nodes based on current mode
    // image-to-video: use image-input dimensions
    // video-to-video: use video-input dimensions
    // text-to-video: no dimensions needed
    // If generation has started, use stored dimensions to prevent recalculation on mode switch
    const currentSourceDimensions = useMemo(() => {
      if (currentMode === "image-to-video") {
        const imageInput = flowConfig?.inputs.find(
          (input) => input.id === "image-input" && input.dataType === "image"
        );
        if (!imageInput) return null;
        return getDimensionsFromSource(id, imageInput.id, edges);
      } else if (currentMode === "video-to-video") {
        const videoInput = flowConfig?.inputs.find(
          (input) => input.id === "video-input" && input.dataType === "video"
        );
        if (!videoInput) return null;
        return getDimensionsFromSource(id, videoInput.id, edges);
      }
      // text-to-video: no source dimensions
      return null;
    }, [edges, flowConfig?.inputs, id, currentMode]);

    // Use stored dimensions if generation has started, otherwise use current source dimensions
    const sourceDimensions = useMemo(() => {
      // If generation has started (generatedOrientation exists), use stored dimensions
      // This prevents container from resizing when switching modes after generation
      if (
        nodeData?.generatedOrientation &&
        nodeData?.generatedSourceDimensions
      ) {
        return nodeData.generatedSourceDimensions as {
          width: number;
          height: number;
        } | null;
      }
      // Otherwise use current source dimensions from the mode
      return currentSourceDimensions;
    }, [
      nodeData?.generatedOrientation,
      nodeData?.generatedSourceDimensions,
      currentSourceDimensions,
    ]);

    const isRequired = useMemo(
      () => flowConfig?.inputs.some((input) => input.required),
      [flowConfig]
    );

    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    const handleNodeClick = useCallback(() => {
      setSelectedNodeId(id);
    }, [id, setSelectedNodeId]);

    const handleVideoClick = useCallback(() => {
      setIsVideoDialogOpen(true);
    }, []);

    const videoDetails = useMemo(
      () => nodeData?.videoDetails as VideoDetails | undefined,
      [nodeData?.videoDetails]
    );

    // Use stored orientation if video exists or generation is in progress, otherwise use config orientation
    // This prevents visual updates when orientation changes in config if video already exists
    const orientation = useMemo(() => {
      // If video exists or generation is in progress, STRICTLY use the orientation stored when generation started
      // Do NOT fall back to config orientation - it might change when switching modes
      if (videoDetails || nodeData?.generatedOrientation) {
        const finalOrientation = (nodeData?.generatedOrientation ||
          "square") as "square" | "landscape" | "portrait";
        console.log("[video-generator-node] Using orientation:", {
          nodeId: id,
          orientation: finalOrientation,
          source: "generatedOrientation (video exists/generation in progress)",
          generatedOrientation: nodeData?.generatedOrientation,
        });
        return finalOrientation;
      }
      // If no video and no generation in progress, use current config orientation
      const finalOrientation = (nodeConfig?.orientation || "square") as
        | "square"
        | "landscape"
        | "portrait";
      console.log("[video-generator-node] Using orientation:", {
        nodeId: id,
        orientation: finalOrientation,
        source: "config (no video/generation)",
        configOrientation: nodeConfig?.orientation,
      });
      return finalOrientation;
    }, [
      id,
      videoDetails,
      nodeData?.generatedOrientation,
      // Only include nodeConfig?.orientation when no generation has started
      // This prevents recalculation when config changes during/after generation
      // Use a conditional to only depend on config orientation when generation hasn't started
      !videoDetails && !nodeData?.generatedOrientation
        ? nodeConfig?.orientation
        : undefined,
    ]);

    // Prevent orientation updates in config when generation has started
    useEffect(() => {
      // If generation has started, prevent orientation changes in config for i2v/v2v modes
      if (nodeData?.generatedOrientation && nodeConfig?.orientation) {
        const currentMode = nodeConfig.mode || "text-to-video";
        // Only block for i2v and v2v modes (t2v can change orientation freely)
        if (
          (currentMode === "image-to-video" ||
            currentMode === "video-to-video") &&
          nodeConfig.orientation !== nodeData.generatedOrientation
        ) {
          // Revert config orientation to match generatedOrientation
          updateNodeConfig(id, {
            ...nodeConfig,
            orientation: nodeData.generatedOrientation as
              | "square"
              | "landscape"
              | "portrait",
          });
        }
      }
    }, [
      id,
      nodeData?.generatedOrientation,
      nodeConfig?.orientation,
      nodeConfig?.mode,
      updateNodeConfig,
    ]);

    const videoUrl = useMemo(
      () => videoDetails?.downloads?.[0]?.url,
      [videoDetails]
    );

    const isGenerating = useMemo(
      () => !!(nodeData?.generatedVideoId && !videoDetails),
      [nodeData?.generatedVideoId, videoDetails]
    );

    // Get video preview dimensions from shared utility
    const { previewDimensionsMap, containerDimensionsMap, containerOverhead } =
      getVideoPreviewDimensions();

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

    // Calculate preview height for VideoPreview component
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
          nodeData?.generatedVideoId as string | undefined,
          videoDetails
        ),
      [nodeData?.generatedVideoId, videoDetails]
    );

    // Apply auto-reset logic from completed to idle
    const finalButtonState = useButtonStateWithAutoReset(computedButtonState);

    const handleGenerate = useCallback(async () => {
      await handleGenerateVideo(id);
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
        offset: 160, // Start at first handle
        height: flowConfig.inputs.length * 40 + 120, // Cover all handles + padding
      };
    }, [flowConfig?.inputs]);

    // Calculate offset for output ghost suggestions (10px below last output handle)
    const outputHandleOffset = useMemo(() => {
      if (!flowConfig?.outputs || flowConfig.outputs.length === 0)
        return undefined;
      const baseOffset = 70;
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
        height: flowConfig.outputs.length * 40 + 200, // Cover all handles + padding
      };
    }, [flowConfig?.outputs]);

    return (
      <>
        <InputGhostNodeSuggestions
          nodeType="video-generator-node"
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
        {/* Invisible deadzone between menu and node to prevent flickering */}
        {availableMenuOptions.length > 0 && (
          <div
            className="absolute pointer-events-auto"
            style={{
              top: "-16px",
              right: "10px",
              width: "300px",
              height: "20px",
            }}
            onMouseEnter={() => setIsMenuHovered(true)}
            onMouseLeave={() => setIsMenuHovered(false)}
          />
        )}

        {/* menu tab switcher */}
        {availableMenuOptions.length > 0 && (
          <motion.div
            className="flex items-center gap-1.5 rounded-lg p-2 max-w-fit absolute -top-14 -right-2.5 pointer-events-auto"
            style={{ zIndex: -1 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: isHovered || selected ? 1 : 0,
              y: isHovered || selected ? 0 : 40,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onMouseEnter={() => setIsMenuHovered(true)}
            onMouseLeave={() => setIsMenuHovered(false)}
          >
            <MenuBar
              options={availableMenuOptions}
              activeOptionId={activeMenuOptionId}
              nodeId={id}
              modeMapping={MENU_OPTION_TO_MODE_MAP}
              onOptionClick={setSelectedNodeId}
            />
          </motion.div>
        )}

        <OutputGhostNodeSuggestions
          nodeType="video-generator-node"
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
            <div className="text-body-desktop-medium mb-3">Generate Video</div>

            {/* Video preview component */}
            <VideoPreview
              videoUrl={videoUrl}
              isGenerating={isGenerating}
              onVideoClick={handleVideoClick}
              orientation={orientation}
              height={previewHeight}
            />

            {/* Generate button and connected assets */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-row gap-2 h-6">
                {flowConfig?.inputs.map((input) => (
                  <ConnectedAssetDisplay
                    key={input.id}
                    connectedAsset={connectedAssets[input.id]}
                    disabled={isHandleDisabled(input.id)}
                  />
                ))}
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
                labelOffsets={{
                  Video: { horizontal: "-2.3rem" },
                }}
                spacing={40}
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
                isRequired={input.required || false}
                nodeId={id}
                index={index}
                handleType="input"
                baseOffset={50}
                spacing={40}
                onSelected={selected}
                isHovered={isHovered}
                isConnected={edges.some(
                  (edge) => edge.target === id && edge.targetHandle === input.id
                )}
                disabled={isHandleDisabled(input.id)}
                labelOffsets={{
                  Image: { horizontal: "-2.5rem" },
                  Prompt: { horizontal: "-2.65rem" },
                  Video: { horizontal: "-2.4rem" },
                }}
              />
            ))}
          </motion.div>
        </NodeAnimation>

        {/* Video Dialog */}
        <VideoDialog
          isOpen={isVideoDialogOpen}
          videoUrl={videoUrl}
          onClose={() => setIsVideoDialogOpen(false)}
        />
      </>
    );
  }
);

VideoGeneratorNode.displayName = "VideoGeneratorNode";

export default VideoGeneratorNode;
