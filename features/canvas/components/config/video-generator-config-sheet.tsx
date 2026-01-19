"use client";

import React, { useCallback, useMemo } from "react";
import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import GenerateButton, {
  type ButtonState,
} from "../shared/generate-button/generate-button";
import { CustomSelect, CustomSlider } from "../shared/controls";
import { MotionTextarea } from "@/components/ui/motion-textarea";
import { Separator } from "@/components/ui/separator";
import {
  END_SECONDS_CONFIG,
  RESOLUTION_OPTIONS,
  ORIENTATION_OPTIONS,
  ART_STYLE_OPTIONS,
  VERSION_OPTIONS,
  PROMPT_TYPE_OPTIONS,
  MODEL_OPTIONS,
  FPS_RESOLUTION_OPTIONS,
  TRIM_CONFIG,
} from "../../constants/nodes/video/video-generator-config";
import { handleGenerateVideo } from "../../handlers/video";
import { estimateMsForNode, formatEta } from "../../lib/shared";
import type { VideoGeneratorNodeConfig } from "../../validations/video";
import { type VideoDetails } from "../../lib/video";
import { MODE_TO_MENU_OPTION_MAP } from "../../constants/nodes/video/video-generator-modes";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
} from "../../lib/shared";

type VideoGeneratorConfigSheetProps = {
  nodeId: string;
};

const MODE_OPTIONS = [
  { value: "text-to-video", label: "Text to Video" },
  { value: "image-to-video", label: "Image to Video" },
  { value: "video-to-video", label: "Video to Video" },
];

const VideoGeneratorConfigSheet: React.FC<VideoGeneratorConfigSheetProps> = ({
  nodeId,
}) => {
  const nodeConfig = useConfigStore(
    (state) =>
      state.nodeConfigs?.[nodeId] as VideoGeneratorNodeConfig | undefined
  );
  const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

  const nodeData = useFlowStore((s) => {
    const node = s.nodes.find((n) => n.id === nodeId);
    return node?.data;
  });

  const edges = useFlowStore((state) => state.edges);

  const currentMode = nodeConfig?.mode || "text-to-video";

  // Connection status helpers
  const connectedImage = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    const incomingEdges = edges.filter(
      (edge) => edge.target === nodeId && edge.targetHandle === "image-input"
    );

    if (incomingEdges.length > 0) {
      const edge = incomingEdges[0];
      const sourceNode = nodes.find((node) => node.id === edge.source);
      const isConnected = !!(
        sourceNode?.data?.imageDetails as VideoDetails | undefined
      )?.downloads?.[0]?.url;
      return isConnected;
    }
    return false;
  }, [edges, nodeId]);

  const connectedVideo = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    const incomingEdges = edges.filter(
      (edge) => edge.target === nodeId && edge.targetHandle === "video-input"
    );

    if (incomingEdges.length > 0) {
      const edge = incomingEdges[0];
      const sourceNode = nodes.find((node) => node.id === edge.source);
      const isConnected = !!(sourceNode?.data?.videoDetails as any)
        ?.downloads?.[0]?.url;
      return isConnected;
    }
    return false;
  }, [edges, nodeId]);

  // Collect prompt from connected prompt input
  const connectedPrompt = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    const incomingEdges = edges.filter(
      (edge) => edge.target === nodeId && edge.targetHandle === "prompt-input"
    );

    if (incomingEdges.length > 0) {
      const edge = incomingEdges[0];
      const sourceNode = nodes.find((node) => node.id === edge.source);
      return (sourceNode?.data?.prompt as string) || "";
    }
    return "";
  }, [edges, nodeId]);

  // Compose full prompt for generation (connected + typed)
  const fullPrompt = useMemo(() => {
    const prompts = [connectedPrompt, nodeConfig?.prompt || ""].filter(
      (p) => p.trim() !== ""
    );
    return prompts.join("\n");
  }, [connectedPrompt, nodeConfig?.prompt]);

  const videoDetails = useMemo(
    () => nodeData?.videoDetails as VideoDetails | undefined,
    [nodeData?.videoDetails]
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

  // Determine if generate button should be disabled
  const isGenerateDisabled = useMemo(() => {
    if (isGenerating) return true;

    switch (currentMode) {
      case "text-to-video":
        return !fullPrompt || fullPrompt.trim() === "";
      case "image-to-video":
        return !connectedImage;
      case "video-to-video":
        return !connectedVideo;
      default:
        return true;
    }
  }, [isGenerating, currentMode, fullPrompt, connectedImage, connectedVideo]);

  const handleGenerate = useCallback(async () => {
    await handleGenerateVideo(nodeId);
  }, [nodeId]);

  const etaMs = useMemo(
    () => estimateMsForNode({ nodeType: "video-generator-node", nodeConfig }),
    [nodeConfig]
  );

  const handleModeChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        mode: value as "text-to-video" | "image-to-video" | "video-to-video",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleEndSecondsChange = useCallback(
    (value: number) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        endSeconds: value,
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleStartSecondsChange = useCallback(
    (value: number) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        startSeconds: value,
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleResolutionChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        resolution: value as "480p" | "720p" | "1080p",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleOrientationChange = useCallback(
    (value: string) => {
      // For image-to-video and video-to-video: don't allow orientation changes if generation has started
      const currentMode = nodeConfig?.mode || "text-to-video";
      const hasGeneratedVideoId = !!(nodeData?.generatedVideoId);
      const hasVideoDetails = !!nodeData?.videoDetails;
      const hasGeneratedOrientation = !!nodeData?.generatedOrientation;
      
      const shouldBlock =
        (currentMode === "image-to-video" || currentMode === "video-to-video") &&
        (hasGeneratedVideoId || hasVideoDetails || hasGeneratedOrientation);

      if (shouldBlock) {
        console.log("[video-generator-config-sheet] Blocking orientation change from config sheet", {
          nodeId,
          currentMode,
          reason: {
            hasGeneratedVideoId,
            hasVideoDetails,
            hasGeneratedOrientation,
          },
        });
        return;
      }

      console.log("[video-generator-config-sheet] Updating orientation from config sheet", {
        nodeId,
        currentMode,
        newOrientation: value,
      });

      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        orientation: value as "portrait" | "landscape" | "square",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig, nodeData?.generatedVideoId, nodeData?.videoDetails, nodeData?.generatedOrientation]
  );

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        prompt: e.target.value,
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleArtStyleChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        artStyle: value,
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleVersionChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        version: value as "v1" | "v2" | "default",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handlePromptTypeChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        promptType: value as "default" | "custom" | "append_default",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleModelChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        model: value as
          | "Dreamshaper"
          | "Absolute Reality"
          | "Flat 2D Anime"
          | "Soft Anime"
          | "Kaywaii"
          | "default",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleFpsResolutionChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        fpsResolution: value as "FULL" | "HALF",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  return (
    <div className="py-6 h-full w-full overflow-auto flex flex-col gap-6">
      <div className="border-b border-border pb-4 px-4">
        <h2 className="text-[14px] font-semibold tracking-tight">
          Video Generator
        </h2>
      </div>

      {/* Mode selector dropdown */}
      <div className="px-4 border-b border-border pb-8">
        <CustomSelect
          label="Generation Mode"
          placeholder="Select mode"
          value={currentMode}
          defaultValue="text-to-video"
          onValueChange={handleModeChange}
          items={MODE_OPTIONS}
        />
      </div>

      <div className="flex flex-col gap-8 px-4">
        {/* TEXT-TO-VIDEO MODE */}
        {currentMode === "text-to-video" && (
          <>
            {/* Prompt Textarea */}
            <div className="flex flex-col gap-3">
              <label className="text-xs ml-1 text-muted-foreground">
                Prompt {connectedPrompt && "(+ connected)"}
              </label>
              <MotionTextarea
                value={nodeConfig?.prompt || ""}
                onChange={handlePromptChange}
                placeholder={
                  connectedPrompt
                    ? "Add additional prompt (will be combined with connected prompt)..."
                    : "Enter video prompt here..."
                }
                minHeight={100}
                animationDuration={0.15}
                animationEase="easeOut"
              />
              {connectedPrompt && (
                <div className="text-xs text-muted-foreground bg-accent/30 rounded p-2 border border-border/50">
                  Connected: {connectedPrompt}
                </div>
              )}
            </div>

            {/* Orientation Dropdown */}
            <CustomSelect
              label="Orientation"
              placeholder="Select orientation"
              value={nodeConfig?.orientation || "landscape"}
              defaultValue="landscape"
              onValueChange={handleOrientationChange}
              items={ORIENTATION_OPTIONS}
            />

            {/* Duration Slider */}
            <CustomSlider
              label="Duration (seconds)"
              value={nodeConfig?.endSeconds || END_SECONDS_CONFIG.min}
              onValueChange={handleEndSecondsChange}
              inputClassName="w-10"
              min={END_SECONDS_CONFIG.min}
              max={END_SECONDS_CONFIG.max}
              step={END_SECONDS_CONFIG.step}
            />

            {/* Resolution Dropdown */}
            <CustomSelect
              label="Resolution"
              placeholder="Select resolution"
              value={nodeConfig?.resolution || "720p"}
              defaultValue="720p"
              onValueChange={handleResolutionChange}
              items={RESOLUTION_OPTIONS}
            />
          </>
        )}

        {/* IMAGE-TO-VIDEO MODE */}
        {currentMode === "image-to-video" && (
          <>
            {/* Duration Slider */}
            <CustomSlider
              label="Duration (seconds)"
              value={nodeConfig?.endSeconds || END_SECONDS_CONFIG.min}
              onValueChange={handleEndSecondsChange}
              inputClassName="w-10"
              min={END_SECONDS_CONFIG.min}
              max={END_SECONDS_CONFIG.max}
              step={END_SECONDS_CONFIG.step}
            />

            {/* Resolution Dropdown */}
            <CustomSelect
              label="Resolution"
              placeholder="Select resolution"
              value={nodeConfig?.resolution || "720p"}
              defaultValue="720p"
              onValueChange={handleResolutionChange}
              items={RESOLUTION_OPTIONS}
            />
          </>
        )}

        {/* VIDEO-TO-VIDEO MODE */}
        {currentMode === "video-to-video" && (
          <>
            {/* Start Seconds Slider */}
            <CustomSlider
              label="Start Time (seconds)"
              value={nodeConfig?.startSeconds || TRIM_CONFIG.startSeconds.min}
              onValueChange={handleStartSecondsChange}
              inputClassName="w-12"
              min={TRIM_CONFIG.startSeconds.min}
              max={TRIM_CONFIG.startSeconds.max}
              step={TRIM_CONFIG.startSeconds.step}
            />

            {/* End Seconds Slider */}
            <CustomSlider
              label="End Time (seconds)"
              value={nodeConfig?.endSeconds || TRIM_CONFIG.endSeconds.min}
              onValueChange={handleEndSecondsChange}
              inputClassName="w-12"
              min={TRIM_CONFIG.endSeconds.min}
              max={TRIM_CONFIG.endSeconds.max}
              step={TRIM_CONFIG.endSeconds.step}
            />

            {/* Art Style Dropdown */}
            <CustomSelect
              label="Art Style"
              placeholder="Select art style"
              value={nodeConfig?.artStyle || "Pixel"}
              defaultValue="Pixel"
              onValueChange={handleArtStyleChange}
              items={ART_STYLE_OPTIONS}
            />

            {/* Version Dropdown */}
            <CustomSelect
              label="Version"
              placeholder="Select version"
              value={nodeConfig?.version || "default"}
              defaultValue="default"
              onValueChange={handleVersionChange}
              items={VERSION_OPTIONS}
            />

            {/* Prompt Type Dropdown */}
            <CustomSelect
              label="Prompt Type"
              placeholder="Select prompt type"
              value={nodeConfig?.promptType || "default"}
              defaultValue="default"
              onValueChange={handlePromptTypeChange}
              items={PROMPT_TYPE_OPTIONS}
            />

            {/* Conditional Prompt Textarea */}
            {(nodeConfig?.promptType === "custom" ||
              nodeConfig?.promptType === "append_default") && (
              <div className="flex flex-col gap-3">
                <label className="text-xs ml-1 text-muted-foreground">
                  Prompt{" "}
                  {nodeConfig?.promptType === "custom"
                    ? "(Required)"
                    : "(Optional)"}
                </label>
                <MotionTextarea
                  value={nodeConfig?.prompt || ""}
                  onChange={handlePromptChange}
                  placeholder="Enter your prompt here..."
                  minHeight={80}
                  animationDuration={0.15}
                  animationEase="easeOut"
                />
              </div>
            )}

            {/* Model Dropdown */}
            <CustomSelect
              label="Model"
              placeholder="Select model"
              value={nodeConfig?.model || "default"}
              defaultValue="default"
              onValueChange={handleModelChange}
              items={MODEL_OPTIONS}
            />

            {/* FPS Resolution Dropdown */}
            <CustomSelect
              label="FPS Resolution"
              placeholder="Select FPS resolution"
              value={nodeConfig?.fpsResolution || "HALF"}
              defaultValue="HALF"
              onValueChange={handleFpsResolutionChange}
              items={FPS_RESOLUTION_OPTIONS}
            />
          </>
        )}
      </div>

      {/* Generate button */}
      <div className="border-t border-border pt-4 px-4 mt-auto">
        {typeof etaMs === "number" && (
          <div className="text-[10px] text-muted-foreground mb-4">
            Est. ~ {formatEta(etaMs)}
          </div>
        )}
        <GenerateButton
          onClick={handleGenerate}
          state={finalButtonState}
          isLoading={isGenerating}
          disabled={isGenerateDisabled}
          className="w-full h-[32px]"
        />
      </div>
    </div>
  );
};

export default React.memo(VideoGeneratorConfigSheet);
