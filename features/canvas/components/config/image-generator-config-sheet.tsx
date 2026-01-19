"use client";

import React, { useCallback, useMemo } from "react";
import useConfigStore from "../../stores/config-store";
import useFlowStore from "../../stores/canvas-store";
import { CustomSelect, CustomSlider } from "../shared/controls";
import GenerateButton, {
  type ButtonState,
} from "../shared/generate-button/generate-button";
import {
  ORIENTATION_OPTIONS,
  STYLE_OPTIONS,
} from "../../constants/nodes/image/image-generator-config";
import { handleImageGenerate } from "../../handlers/image";
import { estimateMsForNode, formatEta } from "../../lib/shared";
import type { AIImageTool } from "../../validations/image";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
} from "../../lib/shared";
import { type ImageDetails } from "../../lib/image";

type ImageGeneratorConfigSheetProps = {
  nodeId: string;
};

const ImageGeneratorConfigSheet: React.FC<ImageGeneratorConfigSheetProps> = ({
  nodeId,
}) => {
  const nodeConfig = useConfigStore((state) => state.nodeConfigs?.[nodeId]);
  const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

  // Only subscribe to node DATA, not position changes
  const nodeData = useFlowStore((s) => {
    const node = s.nodes.find((n) => n.id === nodeId);
    return node?.data;
  });

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

  const handleGenerate = useCallback(async () => {
    await handleImageGenerate(nodeId);
  }, [nodeId]);

  const handleOrientationChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...nodeConfig,
        orientation: value as "square" | "landscape" | "portrait",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleStyleChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...nodeConfig,
        style: { ...nodeConfig?.style, tool: value as AIImageTool },
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleImageCountChange = useCallback(
    (value: number) => {
      updateNodeConfig(nodeId, {
        ...nodeConfig,
        imageCount: value,
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const etaMs = useMemo(
    () => estimateMsForNode({ nodeType: "image-generator-node", nodeConfig }),
    [nodeConfig]
  );

  return (
    <div className="py-6 h-full w-full overflow-auto flex flex-col gap-6">
      <div className="border-b border-border pb-4 px-4">
        <h2 className="text-[14px] font-semibold tracking-tight">
          Image Generator
        </h2>
      </div>

      {/* Orientation select component */}
      <div className="flex flex-col gap-8 px-4">
        <CustomSelect
          label="Orientation"
          placeholder="Select orientation"
          value={nodeConfig?.orientation || "square"}
          defaultValue="square"
          onValueChange={handleOrientationChange}
          items={ORIENTATION_OPTIONS}
        />

        {/* Style selector */}
        <CustomSelect
          label="Art Style"
          placeholder="Select art style"
          value={nodeConfig?.style?.tool || "general"}
          defaultValue="general"
          onValueChange={handleStyleChange}
          items={STYLE_OPTIONS}
        />

        {/* Image slider */}
        <CustomSlider
          label="Image Count"
          value={nodeConfig?.imageCount || 1}
          onValueChange={handleImageCountChange}
          min={1}
          max={4}
          step={1}
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
          disabled={isGenerating}
          className="w-full h-[32px]"
        />
      </div>
    </div>
  );
};

export default React.memo(ImageGeneratorConfigSheet);
