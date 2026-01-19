"use client";

import React, { useCallback, useMemo } from "react";
import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import GenerateButton, {
  type ButtonState,
} from "../shared/generate-button/generate-button";
import { CustomSelect } from "../shared/controls";
import { MotionTextarea } from "@/components/ui/motion-textarea";
import {
  FACE_SWAP_MODE_OPTIONS,
  IMAGE_SOURCE_OPTIONS,
} from "../../constants/nodes/image/face-swap-config";
import { handleFaceSwap } from "../../handlers/image";
import { estimateMsForNode, formatEta } from "../../lib/shared";
import type { FaceSwapNodeConfig } from "../../validations/image";
import { type ImageDetails } from "../../lib/image";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
} from "../../lib/shared";

type FaceSwapConfigSheetProps = {
  nodeId: string;
};

const FaceSwapConfigSheet: React.FC<FaceSwapConfigSheetProps> = ({
  nodeId,
}) => {
  // Subscribe to config for this node
  const nodeConfig = useConfigStore(
    (state) => state.nodeConfigs?.[nodeId] as FaceSwapNodeConfig | undefined
  );
  const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

  // Subscribe to node data
  const nodeData = useFlowStore((s) => {
    const node = s.nodes.find((n) => n.id === nodeId);
    return node?.data;
  });

  const edges = useFlowStore((state) => state.edges);

  const imageSource = nodeConfig?.assets?.imageSource || "file";

  // Check if both images are connected
  const connectedImagesCount = useMemo(() => {
    const sourceEdges = edges.filter(
      (edge) =>
        edge.target === nodeId && edge.targetHandle === "source-face-input"
    );
    const targetEdges = edges.filter(
      (edge) =>
        edge.target === nodeId && edge.targetHandle === "target-face-input"
    );
    return {
      source: sourceEdges.some((edge) => {
        const sourceNode = useFlowStore
          .getState()
          .nodes.find((node) => node.id === edge.source);
        return !!(sourceNode?.data?.imageDetails as ImageDetails | undefined)
          ?.downloads?.[0]?.url;
      }),
      target: targetEdges.some((edge) => {
        const targetNode = useFlowStore
          .getState()
          .nodes.find((node) => node.id === edge.source);
        return !!(targetNode?.data?.imageDetails as ImageDetails | undefined)
          ?.downloads?.[0]?.url;
      }),
    };
  }, [edges, nodeId]);

  const imageDetails = useMemo(
    () => nodeData?.imageDetails as ImageDetails | undefined,
    [nodeData?.imageDetails]
  );

  const isGenerating = useMemo(
    () => !!(nodeData?.generatedImageId && !imageDetails),
    [nodeData?.generatedImageId, imageDetails]
  );

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

  const modeInfo = useMemo(() => {
    const mode = nodeConfig?.faceSwapMode || "all-faces";
    if (mode === "all-faces") {
      return "All faces in target image will be swapped with source face";
    } else {
      return "Detecting and swapping individual faces with automatic mapping";
    }
  }, [nodeConfig?.faceSwapMode]);

  const handleModeChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        faceSwapMode: value as "all-faces" | "individual-faces",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleImageSourceChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        assets: {
          ...(nodeConfig?.assets || {}),
          imageSource: value as "file" | "youtube",
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

  const handleGenerate = useCallback(async () => {
    await handleFaceSwap(nodeId);
  }, [nodeId]);

  const etaMs = useMemo(
    () => estimateMsForNode({ nodeType: "face-swap-node", nodeConfig }),
    [nodeConfig]
  );

  return (
    <div className="py-6 h-full w-full overflow-auto flex flex-col gap-6">
      <div className="border-b border-border pb-4 px-4">
        <h2 className="text-[14px] font-semibold tracking-tight">Face Swap</h2>
      </div>

      <div className="flex flex-col gap-8 px-4">
        {/* Mode Dropdown */}
        <CustomSelect
          label="Swap Mode"
          placeholder="Select mode"
          value={nodeConfig?.faceSwapMode || "all-faces"}
          defaultValue="all-faces"
          onValueChange={handleModeChange}
          items={FACE_SWAP_MODE_OPTIONS}
        />

        {/* Mode Info */}
        <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground leading-relaxed">
          {modeInfo}
        </div>

        {/* Image Source Dropdown */}
        <CustomSelect
          label="Image Source"
          placeholder="Select image source"
          value={nodeConfig?.assets?.imageSource || "file"}
          defaultValue="file"
          onValueChange={handleImageSourceChange}
          items={IMAGE_SOURCE_OPTIONS}
        />

        {/* YouTube URL (conditional) */}
        {imageSource === "youtube" && (
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
          disabled={
            isGenerating ||
            (imageSource === "file" &&
              (!connectedImagesCount.source || !connectedImagesCount.target)) ||
            (imageSource === "youtube" &&
              !nodeConfig?.assets?.youtubeUrl?.trim())
          }
          className="w-full h-[32px]"
        />
      </div>
    </div>
  );
};

export default React.memo(FaceSwapConfigSheet);
