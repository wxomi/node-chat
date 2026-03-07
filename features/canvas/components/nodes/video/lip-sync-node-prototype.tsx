"use client";

import React, { useState, useCallback, useEffect, memo, useMemo } from "react";
import { motion } from "motion/react";
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
import LipSyncVideoSourceMenuBar from "../../menu-bars/lip-sync-video-source-menu-bar";
import { type VideoDetails } from "../../../lib/video";
import { handleLipSync } from "../../../handlers/video";
import type { LipSyncNodeConfig } from "../../../validations/video";
import { SettingsIcon, YouTubeIcon } from "@/constants/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";
import Image from "next/image";
import { AssetPreviewAnimation } from "@/lib/animations/asset-preview-animation";
import ConnectedAssetDisplay from "../../shared/assets/connected-asset-display";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";
import { useNodeHoverState } from "../../../hooks/use-node-hover-state";
import InputGhostNodeSuggestions from "../../shared/ghost-nodes/input-ghost-node-suggestions";
import OutputGhostNodeSuggestions from "../../shared/ghost-nodes/output-ghost-node-suggestions";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
  getVideoPreviewDimensions,
} from "../../../lib/shared";
import { CustomSlider } from "../../shared/controls";
import { TRIM_CONFIG } from "../../../constants/nodes/video/lip-sync-config";

const VIDEO_SOURCE_MENU_OPTIONS = [
  { id: "youtube", label: "YouTube", chartColor: "chart-5" as const },
  {
    id: "file",
    label: "Video",
    chartColor: "red" as const,
    showRing: true,
  },
];

type LipSyncNodePrototypeProps = {
  id: string;
  selected?: boolean;
};

type ConnectedAsset = {
  fileName: string;
  type: string;
  previewUrl?: string;
};

type UploadedAsset = {
  id?: string;
} & Partial<ConnectedAsset>;

const LipSyncNodePrototype: React.FC<LipSyncNodePrototypeProps> = memo(
  ({ id, selected }) => {
    const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
    const updateNodeInternals = useUpdateNodeInternals();
    const setSelectedNodeId = useConfigStore(
      (state) => state.setSelectedNodeId
    );
    const setSettingsNodeId = useConfigStore(
      (state) => state.setSettingsNodeId
    );
    const settingsNodeId = useConfigStore((state) => state.settingsNodeId);
    const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);
    const selectNode = useFlowStore((state) => state.selectNode);

    const {
      setIsNodeHovered,
      setIsMenuHovered,
      setIsGhostHovered,
      setIsGhostContainerHovered,
      setIsInputGhostHovered,
      isHovered,
    } = useNodeHoverState();
    const isMenuVisible = isHovered || selected;

    const nodeData = useFlowStore((s) => {
      const node = s.nodes.find((n) => n.id === id);
      return node?.data;
    });

    const edges = useFlowStore((s) => s.edges);
    const nodeConfig = useConfigStore(
      (state) => state.nodeConfigs?.[id] as LipSyncNodeConfig | undefined
    );

    const flowConfig = useMemo(
      () => nodeData?.flowConfig as NodeFlowConfig | null,
      [nodeData?.flowConfig]
    );

    // Get node disabled state based on connection compatibility
    const { isNodeDisabled } = useNodeDisabledState({
      nodeId: id,
      flowConfig,
    });

    const isRequired = useMemo(
      () => flowConfig?.inputs.some((input) => input.required),
      [flowConfig]
    );

    const videoSource = useConfigStore(
      (state) =>
        (state.nodeConfigs?.[id] as LipSyncNodeConfig | undefined)?.assets
          ?.videoSource || "file"
    );

    const youtubeUrl = useConfigStore(
      (state) =>
        (state.nodeConfigs?.[id] as LipSyncNodeConfig | undefined)?.assets
          ?.youtubeUrl
    );

    const activeMenuOptionId = useMemo(() => videoSource, [videoSource]);

    // Memoize connected assets to prevent constant recomputation
    const connectedAssets = useMemo(() => {
      const assets: Record<string, ConnectedAsset | null> = {};

      flowConfig?.inputs.forEach((input) => {
        const connectedEdge = edges.find(
          (edge) => edge.target === id && edge.targetHandle === input.id
        );

        if (connectedEdge) {
          const sourceNode = useFlowStore
            .getState()
            .nodes.find((n) => n.id === connectedEdge.source);
          if (sourceNode?.data?.uploadedAssets) {
            const uploadedAssets = sourceNode.data.uploadedAssets as
              | UploadedAsset[]
              | undefined;
            const asset = uploadedAssets?.find(
              (uploadedAsset) => uploadedAsset.id === connectedEdge.sourceHandle
            );
            if (asset?.fileName && asset?.type) {
              assets[input.id] = {
                fileName: asset.fileName,
                type: asset.type,
                previewUrl: asset.previewUrl,
              };
            } else {
              assets[input.id] = null;
            }
          } else {
            assets[input.id] = null;
          }
        } else {
          assets[input.id] = null;
        }
      });

      return assets;
    }, [edges, flowConfig?.inputs, id]);

    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    const handleNodeClick = useCallback(() => {
      setSelectedNodeId(id);
    }, [id, setSelectedNodeId]);

    const handleVideoClick = useCallback(() => {
      setIsVideoDialogOpen(true);
    }, []);

    const handleSettingsClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();

        // Track panel state: in view (slid in) vs slid out
        const isPanelInView = selected;
        const isPanelMaximized = settingsNodeId === id;

        if (!isPanelInView) {
          // Panel is slid out, bring it into view and maximize it
          selectNode(id);
          setSelectedNodeId(id);
          setSettingsNodeId(id);
        } else if (isPanelMaximized) {
          // Panel is in view and maximized, minimize it
          setSettingsNodeId(null);
        } else {
          // Panel is in view but minimized, maximize it
          setSettingsNodeId(id);
        }
      },
      [
        id,
        selected,
        settingsNodeId,
        setSettingsNodeId,
        setSelectedNodeId,
        selectNode,
      ]
    );

    const videoDetails = useMemo(
      () => nodeData?.videoDetails as VideoDetails | undefined,
      [nodeData?.videoDetails]
    );

    const videoUrl = useMemo(
      () => videoDetails?.downloads?.[0]?.url,
      [videoDetails]
    );

    const isGenerating = useMemo(
      () => !!(nodeData?.generatedVideoId && !videoDetails),
      [nodeData?.generatedVideoId, videoDetails]
    );

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

    // Use stored orientation if video exists or generation is in progress, otherwise use config orientation
    // Lip sync uses video-input for orientation (video determines output orientation)
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
    const { previewDimensionsMap, containerDimensionsMap } =
      getVideoPreviewDimensions();

    const trimControlsHeight = 96;

    const finalContainerDimensions = useMemo(() => {
      return {
        width: containerDimensionsMap[orientation].width,
        height: containerDimensionsMap[orientation].height + trimControlsHeight,
      };
    }, [containerDimensionsMap, orientation]);

    const handleStartSecondsChange = useCallback(
      (value: number) => {
        updateNodeConfig(id, {
          ...(nodeConfig || {}),
          startSeconds: value,
        });
      },
      [id, nodeConfig, updateNodeConfig]
    );

    const handleEndSecondsChange = useCallback(
      (value: number) => {
        updateNodeConfig(id, {
          ...(nodeConfig || {}),
          endSeconds: value,
        });
      },
      [id, nodeConfig, updateNodeConfig]
    );

    const handleGenerate = useCallback(async () => {
      await handleLipSync(id);
    }, [id]);

    const isHandleDisabled = useCallback(
      (handleId: string): boolean => {
        if (handleId === "video-input") {
          // Enable only when video source is file
          return videoSource !== "file";
        }
        return false;
      },
      [videoSource]
    );

    // Calculate offset for input ghost suggestions (10px below last handle)
    const inputHandleOffset = useMemo(() => {
      if (!flowConfig?.inputs || flowConfig.inputs.length === 0)
        return undefined;
      const baseOffset = 50;
      const spacing = 40;
      const lastHandleIndex = flowConfig.inputs.length - 1;
      const lastHandlePosition = baseOffset + lastHandleIndex * spacing;
      return lastHandlePosition + 10;
    }, [flowConfig?.inputs]);

    // Calculate deadzone config (start at first handle, cover all handles + padding)
    const deadzoneConfig = useMemo(() => {
      if (!flowConfig?.inputs || flowConfig.inputs.length === 0)
        return undefined;
      return {
        offset: 50,
        height: flowConfig.inputs.length * 40 + 20,
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
      return lastHandlePosition + 10;
    }, [flowConfig?.outputs]);

    // Calculate deadzone config for output handles (start at first handle, cover all handles + padding)
    const outputDeadzoneConfig = useMemo(() => {
      if (!flowConfig?.outputs || flowConfig.outputs.length === 0)
        return undefined;
      return {
        offset: 50,
        height: flowConfig.outputs.length * 40 + 20,
      };
    }, [flowConfig?.outputs]);

    return (
      <>
        <InputGhostNodeSuggestions
          nodeType="lip-sync-node-prototype"
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
          nodeType="lip-sync-node-prototype"
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

        {/* Video source menu */}
        <motion.div
          className="flex items-center gap-1.5 rounded-lg p-2 max-w-fit absolute -top-14 -right-2.5 pointer-events-auto"
          style={{ zIndex: -1 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{
            opacity: isMenuVisible ? 1 : 0,
            y: isMenuVisible ? 0 : 40,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onMouseEnter={() => setIsMenuHovered(true)}
          onMouseLeave={() => setIsMenuHovered(false)}
        >
          <LipSyncVideoSourceMenuBar
            options={VIDEO_SOURCE_MENU_OPTIONS}
            activeOptionId={activeMenuOptionId}
            nodeId={id}
            isMenuVisible={isMenuVisible}
          />
        </motion.div>

        <NodeAnimation>
          <motion.div
            className={cn(
              "bg-popover rounded-xl p-4 border border-popover cursor-pointer transition-[width,height] duration-300 ease-in-out",
              isNodeDisabled && "opacity-50"
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
            {/* Node header */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-body-desktop-medium">Sync Lips to Audio</div>

              <Tooltip delayDuration={600}>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ rotate: 90, scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      mass: 2,
                    }}
                    className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={handleSettingsClick}
                  >
                    <Image
                      src={SettingsIcon}
                      alt="Settings"
                      width={14}
                      height={14}
                      className="cursor-pointer hover:brightness-0 hover:invert focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent
                  className="bg-muted text-white text-caption-desktop-regular py-1 px-3 rounded-md border border-border flex items-center gap-2"
                  side="top"
                  align="center"
                  sideOffset={12}
                >
                  <p>Advanced Settings</p>
                  <div className="flex items-center gap-1">
                    <Kbd className="h-4 text-[12px] !text-secondary-foreground rounded-[4px] px-0.5 !bg-secondary border border-border">
                      ⇧
                    </Kbd>
                    <Kbd className="h-4 text-[12px] !text-secondary-foreground rounded-[4px] px-0.5 !bg-secondary border border-border">
                      P
                    </Kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

                 {/* Embedded trim controls */}
            <div className="flex flex-col gap-2 mt-3 mb-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">
                  Start Time (seconds)
                </label>
                <CustomSlider
                  value={nodeConfig?.startSeconds ?? 0}
                  onValueChange={handleStartSecondsChange}
                  inputClassName="w-12"
                  min={TRIM_CONFIG.startSeconds.min}
                  max={TRIM_CONFIG.startSeconds.max}
                  step={TRIM_CONFIG.startSeconds.step}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">
                  End Time (seconds)
                </label>
                <CustomSlider
                  value={nodeConfig?.endSeconds ?? 15}
                  onValueChange={handleEndSecondsChange}
                  inputClassName="w-12"
                  min={TRIM_CONFIG.endSeconds.min}
                  max={TRIM_CONFIG.endSeconds.max}
                  step={TRIM_CONFIG.endSeconds.step}
                />
              </div>
            </div>

            {/* Video preview */}
            <VideoPreview
              videoUrl={videoUrl}
              isGenerating={isGenerating}
              onVideoClick={handleVideoClick}
              orientation={orientation}
              height={previewDimensionsMap[orientation].height}
            />

            {/* Generate button and connected assets */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-row gap-2 h-6">
                {flowConfig?.inputs.map((input) => {
                  // Special case: Show YouTube icon when YouTube is active and has URL
                  if (
                    input.id === "video-input" &&
                    videoSource === "youtube" &&
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
                state={finalButtonState}
                isLoading={isGenerating}
                disabled={isGenerating || isNodeDisabled}
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
                  (edge) => edge.source === id && edge.sourceHandle === output.id
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
                  Audio: { horizontal: "-2.4rem" },
                  Video: { horizontal: "-2.4rem" },
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

LipSyncNodePrototype.displayName = "LipSyncNodePrototype";

export default LipSyncNodePrototype;
