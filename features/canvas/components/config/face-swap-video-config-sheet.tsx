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
  FACE_SWAP_MODE_OPTIONS,
  VERSION_OPTIONS,
  TRIM_CONFIG,
} from "../../constants/nodes/video/face-swap-video-config";
import { handleFaceSwapVideo } from "../../handlers/video";
import { estimateMsForNode, formatEta } from "../../lib/shared";
import type { FaceSwapVideoNodeConfig } from "../../validations/video";
import { type ImageDetails } from "../../lib/image";
import { type VideoDetails } from "../../lib/video";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
} from "../../lib/shared";

type FaceSwapVideoConfigSheetProps = {
  nodeId: string;
};

const FaceSwapVideoConfigSheet: React.FC<FaceSwapVideoConfigSheetProps> = ({
  nodeId,
}) => {
  const nodeConfig = useConfigStore(
    (state) =>
      state.nodeConfigs?.[nodeId] as FaceSwapVideoNodeConfig | undefined
  );
  const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

  const nodeData = useFlowStore((s) => {
    const node = s.nodes.find((n) => n.id === nodeId);
    return node?.data;
  });

  const edges = useFlowStore((state) => state.edges);

  // Check source face connection
  const connectedSourceFace = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    const sourceEdges = edges.filter(
      (edge) =>
        edge.target === nodeId && edge.targetHandle === "source-face-input"
    );
    if (sourceEdges.length > 0) {
      const sourceNode = nodes.find((n) => n.id === sourceEdges[0].source);
      return !!(sourceNode?.data?.imageDetails as ImageDetails | undefined)
        ?.downloads?.[0]?.url;
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
    if (!connectedSourceFace) return true;
    if (videoSource === "file" && !connectedVideo) return true;
    if (videoSource === "youtube") {
      const youtubeUrl = nodeConfig?.assets?.youtubeUrl?.trim();
      if (!youtubeUrl) return true;
    }
    return false;
  }, [
    isGenerating,
    connectedSourceFace,
    connectedVideo,
    videoSource,
    nodeConfig?.assets?.youtubeUrl,
  ]);

  const handleGenerate = useCallback(async () => {
    await handleFaceSwapVideo(nodeId);
  }, [nodeId]);

  const etaMs = useMemo(
    () => estimateMsForNode({ nodeType: "face-swap-video-node", nodeConfig }),
    [nodeConfig]
  );

  const handleModeChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        assets: {
          ...(nodeConfig?.assets || {}),
          faceSwapMode: value as "all-faces" | "individual-faces",
        },
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleVersionChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        style: {
          ...(nodeConfig?.style || {}),
          version: value as "v1" | "v2" | "default",
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

  const modeInfo = useMemo(() => {
    const mode = nodeConfig?.assets?.faceSwapMode || "all-faces";
    if (mode === "all-faces") {
      return "All faces in the video will be swapped with the source face";
    }
    return "Detecting and swapping individual faces with automatic mapping";
  }, [nodeConfig?.assets?.faceSwapMode]);

  return (
    <div className="py-6 h-full w-full overflow-auto flex flex-col gap-6">
      <div className="border-b border-border pb-4 px-4">
        <h2 className="text-[14px] font-semibold tracking-tight">
          Face Swap Video
        </h2>
      </div>

      <div className="flex flex-col gap-8 px-4">
        {/* Swap Mode Dropdown */}
        <CustomSelect
          label="Swap Mode"
          placeholder="Select mode"
          value={nodeConfig?.assets?.faceSwapMode || "all-faces"}
          defaultValue="all-faces"
          onValueChange={handleModeChange}
          items={FACE_SWAP_MODE_OPTIONS}
        />

        {/* Mode Info */}
        <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground leading-relaxed">
          {modeInfo}
        </div>

        {/* Version Dropdown */}
        <CustomSelect
          label="Version"
          placeholder="Select version"
          value={nodeConfig?.style?.version || "default"}
          defaultValue="default"
          onValueChange={handleVersionChange}
          items={VERSION_OPTIONS}
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
              minHeight={60}
              animationDuration={0.15}
              animationEase="easeOut"
            />
          </div>
        )}

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

export default React.memo(FaceSwapVideoConfigSheet);
