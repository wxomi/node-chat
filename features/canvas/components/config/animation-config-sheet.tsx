"use client";

import React, { useCallback, useMemo } from "react";
import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import GenerateButton, {
  type ButtonState,
} from "../shared/generate-button/generate-button";
import { CustomSelect, CustomSlider } from "../shared/controls";
import { MotionTextarea } from "@/components/ui/motion-textarea";
import { handleGenerateAnimation } from "../../handlers/video";
import { estimateMsForNode, formatEta } from "../../lib/shared";
import type { AnimationNodeConfig } from "../../validations/video";
import { type VideoDetails } from "../../lib/video";
import {
  ART_STYLE_OPTIONS,
  CAMERA_EFFECT_OPTIONS,
  PROMPT_TYPE_OPTIONS,
  FPS_CONFIG,
  END_SECONDS_CONFIG,
  TRANSITION_SPEED_CONFIG,
} from "../../constants/nodes/video/animation-config";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
} from "../../lib/shared";

type AnimationConfigSheetProps = {
  nodeId: string;
};

const AnimationConfigSheet: React.FC<AnimationConfigSheetProps> = ({
  nodeId,
}) => {
  const nodeConfig = useConfigStore(
    (state) => state.nodeConfigs?.[nodeId] as AnimationNodeConfig | undefined
  );
  const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

  const nodeData = useFlowStore((s) => {
    const node = s.nodes.find((n) => n.id === nodeId);
    return node?.data;
  });
  const edges = useFlowStore((state) => state.edges);

  const connectedImage = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    const incomingEdges = edges.filter(
      (edge) => edge.target === nodeId && edge.targetHandle === "image-input"
    );
    if (incomingEdges.length > 0) {
      const edge = incomingEdges[0];
      const sourceNode = nodes.find((node) => node.id === edge.source);
      return !!(sourceNode?.data?.imageDetails as VideoDetails | undefined)
        ?.downloads?.[0]?.url;
    }
    return false;
  }, [edges, nodeId]);

  const connectedAudio = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    const incomingEdges = edges.filter(
      (edge) => edge.target === nodeId && edge.targetHandle === "audio-input"
    );
    if (incomingEdges.length > 0) {
      const edge = incomingEdges[0];
      const sourceNode = nodes.find((node) => node.id === edge.source);
      return !!(
        (sourceNode?.data?.audioDetails as any)?.downloads?.[0]?.url ||
        sourceNode?.data?.filePath
      );
    }
    return false;
  }, [edges, nodeId]);

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

  const handleGenerate = useCallback(async () => {
    await handleGenerateAnimation(nodeId);
  }, [nodeId]);

  const etaMs = useMemo(
    () => estimateMsForNode({ nodeType: "animation-node", nodeConfig }),
    [nodeConfig]
  );

  const handleFpsChange = useCallback(
    (value: number) => {
      updateNodeConfig(nodeId, { ...(nodeConfig || {}), fps: value });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleEndSecondsChange = useCallback(
    (value: number) => {
      updateNodeConfig(nodeId, { ...(nodeConfig || {}), endSeconds: value });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleArtStyleChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        style: { ...(nodeConfig?.style || {}), artStyle: value },
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleArtStyleCustomChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        style: { ...(nodeConfig?.style || {}), artStyleCustom: e.target.value },
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleCameraEffectChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        style: { ...(nodeConfig?.style || {}), cameraEffect: value },
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handlePromptTypeChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        style: { ...(nodeConfig?.style || {}), promptType: value as any },
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        style: { ...(nodeConfig?.style || {}), prompt: e.target.value },
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleTransitionSpeedChange = useCallback(
    (value: number) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        style: { ...(nodeConfig?.style || {}), transitionSpeed: value },
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const audioSource = nodeConfig?.assets?.audioSource || "none";
  const isGenerateDisabled = useMemo(() => {
    if (isGenerating) return true;
    if (audioSource === "file" && !connectedAudio) return true;
    if (audioSource === "youtube") {
      const youtubeUrl = nodeConfig?.assets?.youtubeUrl?.trim();
      if (!youtubeUrl) return true;
      if (!youtubeUrl.toLowerCase().includes("youtube")) return true;
    }
    if (nodeConfig?.style?.promptType === "custom") {
      const hasPrompt = !!nodeConfig?.style?.prompt?.trim();
      if (!hasPrompt) return true;
    }
    return false;
  }, [
    isGenerating,
    audioSource,
    connectedAudio,
    nodeConfig?.style?.promptType,
    nodeConfig?.style?.prompt,
    nodeConfig?.assets?.youtubeUrl,
  ]);

  return (
    <div className="py-6 h-full w-full overflow-auto flex flex-col gap-6">
      <div className="border-b border-border pb-4 px-4">
        <h2 className="text-[14px] font-semibold tracking-tight">Animation</h2>
      </div>

      <div className="flex flex-col gap-8 px-4">
        <CustomSlider
          label="FPS"
          value={nodeConfig?.fps || 12}
          onValueChange={handleFpsChange}
          min={FPS_CONFIG.min}
          max={FPS_CONFIG.max}
          inputClassName="w-10"
          step={FPS_CONFIG.step}
        />

        <CustomSlider
          label="Duration (seconds)"
          value={nodeConfig?.endSeconds || 15}
          onValueChange={handleEndSecondsChange}
          inputClassName="w-10"
          min={END_SECONDS_CONFIG.min}
          max={END_SECONDS_CONFIG.max}
          step={END_SECONDS_CONFIG.step}
        />

        <CustomSelect
          label="Art Style"
          placeholder="Select art style"
          value={nodeConfig?.style?.artStyle || "Painterly Illustration"}
          defaultValue="Painterly Illustration"
          onValueChange={handleArtStyleChange}
          items={ART_STYLE_OPTIONS}
        />

        {nodeConfig?.style?.artStyle === "Custom" && (
          <div className="flex flex-col gap-3">
            <label className="text-xs ml-1 text-muted-foreground">
              Custom Art Style
            </label>
            <MotionTextarea
              value={nodeConfig?.style?.artStyleCustom || ""}
              onChange={handleArtStyleCustomChange}
              placeholder="Describe your custom art style..."
              minHeight={80}
              animationDuration={0.15}
              animationEase="easeOut"
            />
          </div>
        )}

        <CustomSelect
          label="Camera Effect"
          placeholder="Select camera effect"
          value={nodeConfig?.style?.cameraEffect || "Simple Zoom In"}
          defaultValue="Simple Zoom In"
          onValueChange={handleCameraEffectChange}
          items={CAMERA_EFFECT_OPTIONS}
        />

        <CustomSelect
          label="Prompt Type"
          placeholder="Select prompt type"
          value={nodeConfig?.style?.promptType || "custom"}
          defaultValue="custom"
          onValueChange={handlePromptTypeChange}
          items={PROMPT_TYPE_OPTIONS}
        />

        {nodeConfig?.style?.promptType === "custom" && (
          <div className="flex flex-col gap-3">
            <label className="text-xs ml-1 text-muted-foreground">
              Prompt (Required)
            </label>
            <MotionTextarea
              value={nodeConfig?.style?.prompt || ""}
              onChange={handlePromptChange}
              placeholder="Enter your prompt..."
              minHeight={80}
              animationDuration={0.15}
              animationEase="easeOut"
            />
          </div>
        )}

        <CustomSlider
          label="Transition Speed"
          value={nodeConfig?.style?.transitionSpeed || 5}
          onValueChange={handleTransitionSpeedChange}
          min={TRANSITION_SPEED_CONFIG.min}
          max={TRANSITION_SPEED_CONFIG.max}
          step={TRANSITION_SPEED_CONFIG.step}
        />
      </div>

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

export default React.memo(AnimationConfigSheet);
