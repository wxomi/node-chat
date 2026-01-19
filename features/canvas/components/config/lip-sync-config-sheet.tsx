"use client";

import React, { useCallback, useMemo } from "react";
import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import GenerateButton, {
  type ButtonState,
} from "../shared/generate-button/generate-button";
import { CustomSelect, CustomSlider } from "../shared/controls";
import { MotionTextarea } from "@/components/ui/motion-textarea";
import {
  GENERATION_MODE_OPTIONS,
  TRIM_CONFIG,
  MAX_FPS_CONFIG,
} from "../../constants/nodes/video/lip-sync-config";
import { handleLipSync } from "../../handlers/video";
import { estimateMsForNode, formatEta } from "../../lib/shared";
import type { LipSyncNodeConfig } from "../../validations/video";
import { type ImageDetails } from "../../lib/image";
import { type VideoDetails } from "../../lib/video";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
} from "../../lib/shared";

type LipSyncConfigSheetProps = {
  nodeId: string;
};

const LipSyncConfigSheet: React.FC<LipSyncConfigSheetProps> = ({ nodeId }) => {
  const nodeConfig = useConfigStore(
    (state) => state.nodeConfigs?.[nodeId] as LipSyncNodeConfig | undefined
  );
  const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

  const nodeData = useFlowStore((s) => {
    const node = s.nodes.find((n) => n.id === nodeId);
    return node?.data;
  });

  const edges = useFlowStore((state) => state.edges);

  // Check audio connection
  const connectedAudio = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    const audioEdges = edges.filter(
      (edge) => edge.target === nodeId && edge.targetHandle === "audio-input"
    );
    if (audioEdges.length > 0) {
      const audioNode = nodes.find((n) => n.id === audioEdges[0].source);
      return !!(
        (audioNode?.data?.audioDetails as any)?.downloads?.[0]?.url ||
        audioNode?.data?.filePath
      );
    }
    return false;
  }, [edges, nodeId]);

  // Check video connection
  const connectedVideo = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    const videoEdges = edges.filter(
      (edge) => edge.target === nodeId && edge.targetHandle === "video-input"
    );
    if (videoEdges.length > 0) {
      const videoNode = nodes.find((n) => n.id === videoEdges[0].source);
      return !!(videoNode?.data?.videoDetails as VideoDetails | undefined)
        ?.downloads?.[0]?.url;
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

  const videoSource = nodeConfig?.assets?.videoSource || "file";

  const isGenerateDisabled = useMemo(() => {
    if (isGenerating) return true;
    if (!connectedAudio) return true;
    if (videoSource === "file" && !connectedVideo) return true;
    if (videoSource === "youtube") {
      const youtubeUrl = nodeConfig?.assets?.youtubeUrl?.trim();
      if (!youtubeUrl) return true;
    }
    return false;
  }, [
    isGenerating,
    connectedAudio,
    connectedVideo,
    videoSource,
    nodeConfig?.assets?.youtubeUrl,
  ]);

  const handleGenerate = useCallback(async () => {
    await handleLipSync(nodeId);
  }, [nodeId]);

  const etaMs = useMemo(
    () => estimateMsForNode({ nodeType: "lip-sync-node", nodeConfig }),
    [nodeConfig]
  );

  const handleGenerationModeChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        style: {
          ...(nodeConfig?.style || {}),
          generationMode: value as "lite" | "standard" | "pro",
        },
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleVideoSourceChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        assets: {
          ...(nodeConfig?.assets || {}),
          videoSource: value as "file" | "youtube",
        },
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleYoutubeUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        assets: {
          ...(nodeConfig?.assets || {}),
          youtubeUrl: e.target.value,
        },
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

  const handleEndSecondsChange = useCallback(
    (value: number) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        endSeconds: value,
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleMaxFpsChange = useCallback(
    (value: number) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        maxFpsLimit: value,
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  return (
    <div className="py-6 h-full w-full overflow-auto flex flex-col gap-6">
      <div className="border-b border-border pb-4 px-4">
        <h2 className="text-[14px] font-semibold tracking-tight">Lip Sync</h2>
      </div>

      <div className="flex flex-col gap-8 px-4">
        {/* Generation Mode Dropdown */}
        <CustomSelect
          label="Generation Mode"
          placeholder="Select mode"
          value={nodeConfig?.style?.generationMode || "lite"}
          defaultValue="lite"
          onValueChange={handleGenerationModeChange}
          items={GENERATION_MODE_OPTIONS}
        />

        {/* Max FPS Limit Slider */}
        <CustomSlider
          label="Max FPS Limit"
          value={nodeConfig?.maxFpsLimit || 12}
          onValueChange={handleMaxFpsChange}
          inputClassName="w-10"
          min={MAX_FPS_CONFIG.min}
          max={MAX_FPS_CONFIG.max}
          step={MAX_FPS_CONFIG.step}
        />

        {/* Start Seconds Slider */}
        <CustomSlider
          label="Start Time (seconds)"
          value={nodeConfig?.startSeconds || 0}
          onValueChange={handleStartSecondsChange}
          inputClassName="w-12"
          min={TRIM_CONFIG.startSeconds.min}
          max={TRIM_CONFIG.startSeconds.max}
          step={TRIM_CONFIG.startSeconds.step}
        />

        {/* End Seconds Slider */}
        <CustomSlider
          label="End Time (seconds)"
          value={nodeConfig?.endSeconds || 15}
          onValueChange={handleEndSecondsChange}
          inputClassName="w-12"
          min={TRIM_CONFIG.endSeconds.min}
          max={TRIM_CONFIG.endSeconds.max}
          step={TRIM_CONFIG.endSeconds.step}
        />

        {/* Video Source Dropdown */}
        <CustomSelect
          label="Video Source"
          placeholder="Select video source"
          value={nodeConfig?.assets?.videoSource || "file"}
          defaultValue="file"
          onValueChange={handleVideoSourceChange}
          items={[
            { value: "file", label: "Video" },
            { value: "youtube", label: "YouTube" },
          ]}
        />

        {/* YouTube URL (conditional) */}
        {videoSource === "youtube" && (
          <div className="flex flex-col gap-3">
            <label className="text-xs ml-1 text-muted-foreground">
              YouTube URL (Required)
            </label>
            <MotionTextarea
              value={nodeConfig?.assets?.youtubeUrl || ""}
              onChange={handleYoutubeUrlChange}
              placeholder="Enter YouTube URL..."
              minHeight={100}
              animationDuration={0.15}
              animationEase="easeOut"
            />
          </div>
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

export default React.memo(LipSyncConfigSheet);
