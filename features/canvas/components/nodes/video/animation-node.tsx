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
import GenerateButton from "../../shared/generate-button/generate-button";
import VideoDialog from "../../shared/dialogs/video-dialog";
import VideoPreview from "../../shared/assets/video-preview";
import AnimationAudioMenuBar from "../../menu-bars/animation-audio-menu-bar";
import ConnectedAssetDisplay from "../../shared/assets/connected-asset-display";
import { type VideoDetails } from "../../../lib/video";
import { handleGenerateAnimation } from "../../../handlers/video";
import type { AnimationNodeConfig } from "../../../validations/video";
import { YouTubeIcon } from "@/constants/icons";
import Image from "next/image";
import { AssetPreviewAnimation } from "@/lib/animations/asset-preview-animation";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";
import { useNodeHoverState } from "../../../hooks/use-node-hover-state";
import InputGhostNodeSuggestions from "../../shared/ghost-nodes/input-ghost-node-suggestions";
import OutputGhostNodeSuggestions from "../../shared/ghost-nodes/output-ghost-node-suggestions";
import {
  getVideoPreviewDimensions,
  getDimensionsFromSource,
  calculateCustomContainerDimensions,
} from "../../../lib/shared";

type AnimationNodeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const AUDIO_MENU_OPTIONS = [
  { id: "youtube", label: "YouTube", icon: YouTubeIcon },
  {
    id: "file",
    label: "Audio",
    chartColor: "chart-3" as const,
    showRing: true,
  },
  { id: "none", label: "None" },
];

const AnimationNode: React.FC<AnimationNodeProps> = memo(
  ({ id, selected, dragging }) => {
    const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
    const updateNodeInternals = useUpdateNodeInternals();
    const setSelectedNodeId = useConfigStore(
      (state) => state.setSelectedNodeId
    );
    const nodeConfig = useConfigStore(
      (state) =>
        (state.nodeConfigs?.[id] as AnimationNodeConfig | undefined)
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

    const nodeData = useFlowStore((s) => {
      const node = s.nodes.find((n) => n.id === id);
      return node?.data;
    });

    const audioSource = useConfigStore(
      (state) =>
        (state.nodeConfigs?.[id] as AnimationNodeConfig | undefined)?.assets
          ?.audioSource || "none"
    );

    const youtubeUrl = useConfigStore(
      (state) =>
        (state.nodeConfigs?.[id] as AnimationNodeConfig | undefined)?.assets
          ?.youtubeUrl
    );

    const activeMenuOptionId = useMemo(() => audioSource, [audioSource]);

    const edges = useFlowStore((s) => s.edges);

    const flowConfig = useMemo(
      () => nodeData?.flowConfig as NodeFlowConfig | null,
      [nodeData?.flowConfig]
    );

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
      // If video exists or generation is in progress, use the orientation stored when generation started
      if (videoDetails || nodeData?.generatedOrientation) {
        return (nodeData?.generatedOrientation ||
          nodeConfig?.orientation ||
          "square") as "square" | "landscape" | "portrait";
      }
      // If no video and no generation in progress, use current config orientation
      return (nodeConfig?.orientation || "square") as
        | "square"
        | "landscape"
        | "portrait";
    }, [videoDetails, nodeData?.generatedOrientation, nodeConfig?.orientation]);

    // Get video preview dimensions from shared utility
    const { previewDimensionsMap, containerDimensionsMap, containerOverhead } =
      getVideoPreviewDimensions();

    // Extract source dimensions from connected upload node for image-input
    const sourceDimensions = useMemo(() => {
      const imageInput = flowConfig?.inputs.find(
        (input) => input.id === "image-input" && input.dataType === "image"
      );
      if (!imageInput) return null;

      return getDimensionsFromSource(id, imageInput.id, edges);
    }, [edges, flowConfig?.inputs, id]);

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

    const videoUrl = useMemo(
      () => videoDetails?.downloads?.[0]?.url,
      [videoDetails]
    );
    const isGenerating = useMemo(
      () => !!(nodeData?.generatedVideoId && !videoDetails),
      [nodeData?.generatedVideoId, videoDetails]
    );

    const handleGenerate = useCallback(async () => {
      await handleGenerateAnimation(id);
    }, [id]);

    const isHandleDisabled = useCallback(
      (handleId: string): boolean => {
        if (handleId === "audio-input") {
          // Enable only when audio source is file
          return audioSource !== "file";
        }
        return false;
      },
      [audioSource]
    );

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
        height: flowConfig.inputs.length * 40 + 200, // Cover all handles + padding
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
        offset: 120, // Start at first handle
        height: flowConfig.outputs.length * 40 + 200, // Cover all handles + padding
      };
    }, [flowConfig?.outputs]);

    return (
      <>
        <InputGhostNodeSuggestions
          nodeType="animation-node"
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
          nodeType="animation-node"
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
          deadzoneWidth={33}
        />
        {/* Invisible deadzone between menu and node to prevent flickering */}
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

        {/* audio mode menu */}
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
          <AnimationAudioMenuBar
            options={AUDIO_MENU_OPTIONS}
            activeOptionId={activeMenuOptionId}
            nodeId={id}
            onOptionClick={setSelectedNodeId}
            isMenuVisible={isHovered || selected}
          />
        </motion.div>

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
              Create Animation
            </div>

            {/* Video preview */}
            <VideoPreview
              videoUrl={videoUrl}
              isGenerating={isGenerating}
              onVideoClick={handleVideoClick}
              orientation={orientation}
              height={previewHeight}
            />

            {/* Generate button and connected assets */}
            <div className="flex items-center justify-between mt-1">
              <div className="flex flex-row gap-2 h-6">
                {flowConfig?.inputs.map((input) => {
                  // Special case: Show YouTube icon when YouTube is active and has URL
                  if (
                    input.id === "audio-input" &&
                    audioSource === "youtube" &&
                    youtubeUrl
                  ) {
                    return (
                      <AssetPreviewAnimation
                        key={input.id}
                        className={`size-6 rounded overflow-hidden flex-shrink-0 transition-opacity ${
                          isHandleDisabled(input.id) ? "opacity-50" : ""
                        }`}
                      >
                        <Image
                          src={YouTubeIcon}
                          alt="YouTube"
                          width={28}
                          height={28}
                          className="w-full h-full object-contain p-0.5"
                        />
                      </AssetPreviewAnimation>
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
                isLoading={isGenerating}
                disabled={isGenerating}
              />
            </div>

            {/* Handles */}
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
                  Audio: { horizontal: "-2.4rem" },
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

        {/* Video dialog */}
        <VideoDialog
          isOpen={isVideoDialogOpen}
          videoUrl={videoUrl}
          onClose={() => setIsVideoDialogOpen(false)}
        />
      </>
    );
  }
);

AnimationNode.displayName = "AnimationNode";

export default AnimationNode;
