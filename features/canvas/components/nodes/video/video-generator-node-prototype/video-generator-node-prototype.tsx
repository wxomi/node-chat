"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  memo,
  useMemo,
  useRef,
} from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { useUpdateNodeInternals } from "@xyflow/react";
import useFlowStore from "../../../../stores/canvas-store";
import useConfigStore from "../../../../stores/config-store";
import { cn } from "@/lib/utils";
import { NodeFlowConfig } from "../../../../types/sidebar.types";
import CustomHandle from "../../../shared/connections/custom-handle";
import { NodeAnimation } from "@/lib/animations/node-animation";
import VideoDialog from "../../../shared/dialogs/video-dialog";
import MenuBar from "../../../menu-bars/video-generator-menu-bar-prototype";
import { type VideoDetails } from "../../../../lib/video";
import { handleGenerateVideoPrototype } from "../../../../handlers/video";
import type { VideoGeneratorNodeConfig } from "../../../../validations/video";
import {
  MENU_OPTION_TO_MODE_MAP,
  VIDEO_GENERATOR_MENU_OPTIONS,
} from "../../../../constants/nodes/video/video-generator-modes";
import {
  TextToVideoControls,
  ImageToVideoControls,
  VideoToVideoControls,
} from "./index";
import { useNodeDisabledState } from "../../../../hooks/use-node-disabled-state";
import { useNodeHoverState } from "../../../../hooks/use-node-hover-state";
import InputGhostNodeSuggestions from "../../../shared/ghost-nodes/input-ghost-node-suggestions";
import OutputGhostNodeSuggestions from "../../../shared/ghost-nodes/output-ghost-node-suggestions";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
  getVideoPreviewDimensions,
  getDimensionsFromSource,
  calculateCustomContainerDimensions,
} from "../../../../lib/shared";
import { getOrientationFromSource } from "../../../../lib/shared/orientation-propagation";
import type { ButtonState } from "../../../shared/generate-button/generate-button";
import { SettingsIcon } from "@/constants/icons";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "@/components/ui/kbd";

type VideoGeneratorNodePrototypeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const VideoGeneratorNodePrototype: React.FC<VideoGeneratorNodePrototypeProps> =
  memo(({ id, selected, dragging }) => {
    const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [direction, setDirection] = useState(1); // 1 for right, -1 for left
    const prevMenuOptionIdRef = useRef<string | undefined>(undefined);
    const updateNodeInternals = useUpdateNodeInternals();
    const setSelectedNodeId = useConfigStore(
      (state) => state.setSelectedNodeId
    );
    const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);
    const setSettingsNodeId = useConfigStore(
      (state) => state.setSettingsNodeId
    );
    const settingsNodeId = useConfigStore((state) => state.settingsNodeId);
    const selectNode = useFlowStore((state) => state.selectNode);
    // Use explicit selector to ensure reactivity to mode changes
    const nodeConfig = useConfigStore(
      (state) => state.nodeConfigs[id] as VideoGeneratorNodeConfig | undefined
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

    const updateNodeData = useFlowStore((state) => state.updateNodeData);
    const nodeData = useFlowStore((s) => {
      const node = s.nodes.find((n) => n.id === id);
      return node?.data;
    });

    // Use nodeConfig directly to ensure reactivity to mode changes
    const currentMode = useMemo(
      () => nodeConfig?.mode || "text-to-video",
      [nodeConfig?.mode]
    );

    const activeMenuOptionId = useMemo(() => {
      return Object.entries(MENU_OPTION_TO_MODE_MAP).find(
        ([_, mode]) => mode === currentMode
      )?.[0];
    }, [currentMode]);

    // Menu option positions: prompt = 0, image = 1, video = 2
    const getMenuOptionPosition = useCallback(
      (optionId: string | undefined): number => {
        if (!optionId) return 0;
        const positions: Record<string, number> = {
          prompt: 0,
          image: 1,
          video: 2,
        };
        return positions[optionId] ?? 0;
      },
      []
    );

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
    const nodeConfigs = useConfigStore((state) => state.nodeConfigs);

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

    // Always show all menu options (prototype behavior)
    const availableMenuOptions = useMemo(() => {
      return VIDEO_GENERATOR_MENU_OPTIONS;
    }, []);

    // Prototype behavior: Disabled auto-switch logic
    // Allow users to switch modes freely regardless of connections
    // Handle disabling is controlled by isHandleDisabled function

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

    const handleSettingsClick = useCallback(
      (e: React.MouseEvent) => {
        // Track panel state: in view (slid in) vs slid out
        const isPanelInView = selected; // Panel is in view when node is selected
        const isPanelMaximized = settingsNodeId === id; // Panel is maximized when settingsNodeId matches

        if (!isPanelInView) {
          // Panel is slid out, bring it into view and maximize it
          selectNode(id);
          // selects the node and shows the settings panel
          setSelectedNodeId(id);
          // maximises the panel
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

    // Get source orientation for i2v/v2v modes
    const sourceOrientation = useMemo(() => {
      if (currentMode === "image-to-video") {
        return getOrientationFromSource(id, "image-input", edges, nodeConfigs);
      } else if (currentMode === "video-to-video") {
        return getOrientationFromSource(id, "video-input", edges, nodeConfigs);
      }
      return null;
    }, [id, currentMode, edges, nodeConfigs]);

    // Reset orientation to square when switching to i2v/v2v modes (one-time reset)
    // Don't update from source here - let the handler update it when generation starts
    useEffect(() => {
      // Only reset if no generation has started and switching to i2v/v2v mode
      if (
        !nodeData?.generatedOrientation &&
        !videoDetails &&
        (currentMode === "image-to-video" ||
          currentMode === "video-to-video") &&
        nodeConfig?.orientation &&
        nodeConfig.orientation !== "square"
      ) {
        // Reset to square when switching to i2v/v2v modes
        // The handler will update it from source when generation starts
        updateNodeConfig(id, {
          ...nodeConfig,
          orientation: "square",
        });
      }
    }, [
      id,
      currentMode,
      nodeData?.generatedOrientation,
      videoDetails,
      nodeConfig?.orientation,
      updateNodeConfig,
    ]);

    // Use stored orientation if video exists or generation is in progress, otherwise use config orientation
    // This prevents visual updates when orientation changes in config if video already exists
    // For i2v/v2v modes, use config orientation (stays square until handler updates it on generation)
    const orientation = useMemo(() => {
      // If video exists or generation is in progress, STRICTLY use the orientation stored when generation started
      // Do NOT fall back to config orientation - it might change when switching modes
      if (videoDetails || nodeData?.generatedOrientation) {
        const finalOrientation = (nodeData?.generatedOrientation ||
          "square") as "square" | "landscape" | "portrait";
        console.log("[video-generator-node-prototype] Using orientation:", {
          nodeId: id,
          orientation: finalOrientation,
          source: "generatedOrientation (video exists/generation in progress)",
          generatedOrientation: nodeData?.generatedOrientation,
        });
        return finalOrientation;
      }

      // For i2v/v2v modes, use config orientation (which is square after reset)
      // Don't use sourceOrientation here - config stays square until handler updates it when generation starts
      // This matches remove-background-node behavior
      if (
        currentMode === "image-to-video" ||
        currentMode === "video-to-video"
      ) {
        const finalOrientation = (nodeConfig?.orientation || "square") as
          | "square"
          | "landscape"
          | "portrait";
        console.log("[video-generator-node-prototype] Using orientation:", {
          nodeId: id,
          orientation: finalOrientation,
          source:
            "config (i2v/v2v mode - stays square until generation starts)",
          configOrientation: nodeConfig?.orientation,
          sourceOrientation, // Log for debugging but don't use
        });
        return finalOrientation;
      }

      // For text-to-video mode, check nodeData.orientation first (from AnimatedOrientationSelect),
      // then fall back to config orientation
      const finalOrientation = (nodeData?.orientation ||
        nodeConfig?.orientation ||
        "square") as "square" | "landscape" | "portrait";
      console.log("[video-generator-node-prototype] Using orientation:", {
        nodeId: id,
        orientation: finalOrientation,
        source: "nodeData.orientation or config (text-to-video mode)",
        nodeDataOrientation: nodeData?.orientation,
        configOrientation: nodeConfig?.orientation,
      });
      return finalOrientation;
    }, [
      id,
      videoDetails,
      nodeData?.generatedOrientation,
      nodeData?.orientation,
      currentMode,
      // Include nodeConfig?.orientation - handler will update it when generation starts
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

    // Calculate control heights for each mode (excluding preview)
    // Text-to-video: PromptBlock (~153px) + Duration slider (~60px) + gap-3 (12px) = ~225px
    // Image-to-video: Duration slider (~60px) = ~60px
    // Video-to-video: CustomSelect (~40px) + Start slider (~60px) + End slider (~60px) + gaps (24px) = ~184px
    const controlHeights = useMemo(() => {
      const heights = {
        "text-to-video": 172,
        "image-to-video": 58,
        "video-to-video": 166,
      };
      return heights[currentMode] || 225;
    }, [currentMode]);

    // Use custom dimensions if available, otherwise use fixed dimensions
    const baseContainerDimensions = useMemo(() => {
      return customContainerDimensions || containerDimensionsMap[orientation];
    }, [customContainerDimensions, containerDimensionsMap, orientation]);

    // Calculate preview height for VideoPreview component
    // Always use orientation-based preview height to ensure consistency
    const previewHeight = useMemo(() => {
      return previewDimensionsMap[orientation].height;
    }, [previewDimensionsMap, orientation]);

    // Add control heights to container dimensions
    // The final height should include:
    // - Controls height (varies by mode)
    // - Preview height (always orientation-based)
    // - Container overhead (padding, title, button area, gaps)
    const finalContainerDimensions = useMemo(() => {
      // For text-to-video mode, always use orientation-based dimensions
      // For i2v/v2v modes with custom dimensions, use custom width but orientation-based preview height
      if (currentMode === "text-to-video" || !customContainerDimensions) {
        return {
          width: containerDimensionsMap[orientation].width,
          height: controlHeights + previewHeight + containerOverhead.total,
        };
      }

      // For custom dimensions (i2v/v2v), use custom width but ensure preview height matches orientation
      return {
        width: customContainerDimensions.width,
        height: controlHeights + previewHeight + containerOverhead.total,
      };
    }, [
      currentMode,
      customContainerDimensions,
      containerDimensionsMap,
      orientation,
      controlHeights,
      previewHeight,
      containerOverhead.total,
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
      await handleGenerateVideoPrototype(id);
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

    // Handle prompt change
    const handlePromptChange = useCallback(
      (newPrompt: string) => {
        updateNodeConfig(id, { prompt: newPrompt });
      },
      [id, updateNodeConfig]
    );

    const handlePromptBlur = useCallback(
      (newPrompt: string) => {
        updateNodeConfig(id, { prompt: newPrompt });
      },
      [id, updateNodeConfig]
    );

    const handleEndSecondsChange = useCallback(
      (value: number) => {
        updateNodeConfig(id, { endSeconds: value });
      },
      [id, updateNodeConfig]
    );

    const handleStartSecondsChange = useCallback(
      (value: number) => {
        updateNodeConfig(id, { startSeconds: value });
      },
      [id, updateNodeConfig]
    );

    const handleArtStyleChange = useCallback(
      (value: string) => {
        updateNodeConfig(id, { artStyle: value });
      },
      [id, updateNodeConfig]
    );

    // Handle mode change from menu bar - calculate direction and set transitioning state
    const handleModeChange = useCallback(
      (newOptionId: string) => {
        // If no previous option, default to right direction (1)
        if (!prevMenuOptionIdRef.current) {
          prevMenuOptionIdRef.current = activeMenuOptionId || newOptionId;
        }
        const prevPosition = getMenuOptionPosition(prevMenuOptionIdRef.current);
        const newPosition = getMenuOptionPosition(newOptionId);
        // Calculate direction: if moving to a higher position (right), direction = 1, else -1
        const calculatedDirection = newPosition > prevPosition ? 1 : -1;
        setDirection(calculatedDirection);
        setIsTransitioning(true);
        prevMenuOptionIdRef.current = newOptionId;
      },
      [getMenuOptionPosition, activeMenuOptionId]
    );

    // Animation variants for direction-aware transitions
    const slideVariants = {
      initial: (dir: number) => ({
        x: `${110 * dir}%`,
        filter: "blur(10px)",
        opacity: 0,
      }),
      active: {
        x: "0%",
        filter: "blur(0px)",
        opacity: 1,
      },
      exit: (dir: number) => ({
        x: `${-110 * dir}%`,
        filter: "blur(10px)",
        opacity: 0,
      }),
    };

    // Render the appropriate control component based on the active menu option
    const renderControls = useMemo(() => {
      switch (activeMenuOptionId) {
        case "prompt":
          return (
            <TextToVideoControls
              nodeId={id}
              prompt={nodeConfig?.prompt || ""}
              endSeconds={nodeConfig?.endSeconds}
              videoUrl={videoUrl}
              isGenerating={isGenerating}
              orientation={orientation}
              previewHeight={previewHeight}
              onPromptChange={handlePromptChange}
              onPromptBlur={handlePromptBlur}
              onEndSecondsChange={handleEndSecondsChange}
              onVideoClick={handleVideoClick}
              flowConfig={flowConfig}
              connectedAssets={connectedAssets}
              isHandleDisabled={isHandleDisabled}
              onGenerate={handleGenerate}
              buttonState={finalButtonState}
              isNodeDisabled={isNodeDisabled}
              onOrientationChange={(value) => {
                updateNodeData(id, { orientation: value });
              }}
            />
          );
        case "image":
          return (
            <ImageToVideoControls
              endSeconds={nodeConfig?.endSeconds}
              videoUrl={videoUrl}
              isGenerating={isGenerating}
              orientation={orientation}
              previewHeight={previewHeight}
              onEndSecondsChange={handleEndSecondsChange}
              onVideoClick={handleVideoClick}
              flowConfig={flowConfig}
              connectedAssets={connectedAssets}
              isHandleDisabled={isHandleDisabled}
              onGenerate={handleGenerate}
              buttonState={finalButtonState}
              isNodeDisabled={isNodeDisabled}
            />
          );
        case "video":
          return (
            <VideoToVideoControls
              artStyle={nodeConfig?.artStyle}
              startSeconds={nodeConfig?.startSeconds}
              endSeconds={nodeConfig?.endSeconds}
              videoUrl={videoUrl}
              isGenerating={isGenerating}
              orientation={orientation}
              previewHeight={previewHeight}
              onArtStyleChange={handleArtStyleChange}
              onStartSecondsChange={handleStartSecondsChange}
              onEndSecondsChange={handleEndSecondsChange}
              onVideoClick={handleVideoClick}
              flowConfig={flowConfig}
              connectedAssets={connectedAssets}
              isHandleDisabled={isHandleDisabled}
              onGenerate={handleGenerate}
              buttonState={finalButtonState}
              isNodeDisabled={isNodeDisabled}
            />
          );
        default:
          return (
            <TextToVideoControls
              nodeId={id}
              prompt={nodeConfig?.prompt || ""}
              endSeconds={nodeConfig?.endSeconds}
              videoUrl={videoUrl}
              isGenerating={isGenerating}
              orientation={orientation}
              previewHeight={previewHeight}
              onPromptChange={handlePromptChange}
              onPromptBlur={handlePromptBlur}
              onEndSecondsChange={handleEndSecondsChange}
              onVideoClick={handleVideoClick}
              flowConfig={flowConfig}
              connectedAssets={connectedAssets}
              isHandleDisabled={isHandleDisabled}
              onGenerate={handleGenerate}
              buttonState={finalButtonState}
              isNodeDisabled={isNodeDisabled}
              onOrientationChange={(value) => {
                updateNodeData(id, { orientation: value });
              }}
            />
          ); // Default to text-to-video
      }
    }, [
      activeMenuOptionId,
      id,
      nodeConfig?.prompt,
      nodeConfig?.endSeconds,
      nodeConfig?.artStyle,
      nodeConfig?.startSeconds,
      videoUrl,
      isGenerating,
      orientation,
      previewHeight,
      handlePromptChange,
      handlePromptBlur,
      handleEndSecondsChange,
      handleStartSecondsChange,
      handleArtStyleChange,
      handleVideoClick,
      flowConfig,
      connectedAssets,
      isHandleDisabled,
      handleGenerate,
      finalButtonState,
      isNodeDisabled,
      updateNodeData,
    ]);

    return (
      <>
        <InputGhostNodeSuggestions
          nodeType="video-generator-node-prototype"
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

        {/* menu tab switcher */}
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
            onModeChange={handleModeChange}
            onOptionClick={setSelectedNodeId}
          />
        </motion.div>

        <OutputGhostNodeSuggestions
          nodeType="video-generator-node-prototype"
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

        {/* todo: Add settings to the video generator node */}

        <NodeAnimation>
          <motion.div
            className={cn(
              "bg-popover rounded-xl py-4 border border-popover cursor-pointer transition-[width] duration-300 ease-in-out",
              isNodeDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              borderRadius: "14px",
              width: finalContainerDimensions.width,
              ...(selected && {
                backgroundColor: "var(--node-selected)",
                borderColor: "var(--node-selected-border)",
              }),
            }}
            initial={{ height: finalContainerDimensions.height }}
            animate={{
              height: finalContainerDimensions.height,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              mass: 0.8,
            }}
            onMouseEnter={() => setIsNodeHovered(true)}
            onMouseLeave={() => setIsNodeHovered(false)}
            onClick={handleNodeClick}
          >
            {/* Node header */}
            <div className="flex justify-between items-center mb-3 px-4">
              {/* Node title */}
              <div className="text-body-desktop-medium">Generate Video</div>
              {/* Advanced settings cog icon */}
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

            {/* Embedded controls based on active mode */}
            <div
              className={cn("px-4", {
                "relative overflow-x-hidden": isTransitioning,
              })}
            >
              <MotionConfig
                transition={{ duration: 0.5, type: "spring", bounce: 0 }}
              >
                <AnimatePresence
                  mode="popLayout"
                  initial={false}
                  custom={direction}
                  onExitComplete={() => setIsTransitioning(false)}
                >
                  <motion.div
                    key={activeMenuOptionId}
                    variants={slideVariants}
                    initial="initial"
                    animate="active"
                    exit="exit"
                    custom={direction}
                  >
                    {renderControls}
                  </motion.div>
                </AnimatePresence>
              </MotionConfig>
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
  });

VideoGeneratorNodePrototype.displayName = "VideoGeneratorNodePrototype";

export default VideoGeneratorNodePrototype;
