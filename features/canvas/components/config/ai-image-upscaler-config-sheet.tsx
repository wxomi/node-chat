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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  SCALE_FACTOR_OPTIONS,
  ENHANCEMENT_OPTIONS,
} from "../../constants/nodes/image/ai-image-upscaler-config";
import { handleUpscaleImage } from "../../handlers/image";
import { estimateMsForNode, formatEta } from "../../lib/shared";
import type { AIImageUpscalerNodeConfig } from "../../validations/image";
import { type ImageDetails } from "../../lib/image";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
} from "../../lib/shared";

type AIImageUpscalerConfigSheetProps = {
  nodeId: string;
};

const AIImageUpscalerConfigSheet: React.FC<AIImageUpscalerConfigSheetProps> = ({
  nodeId,
}) => {
  // Subscribe to config for this node (cast to AIImageUpscalerNodeConfig)
  const nodeConfig = useConfigStore(
    (state) =>
      state.nodeConfigs?.[nodeId] as AIImageUpscalerNodeConfig | undefined
  );
  const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

  // Only subscribe to node DATA, not position changes
  const nodeData = useFlowStore((s) => {
    const node = s.nodes.find((n) => n.id === nodeId);
    return node?.data;
  });

  const edges = useFlowStore((state) => state.edges);

  // Memoize whether prompt is enabled based on enhancement value
  const isPromptEnabled = useMemo(
    () => nodeConfig?.enhancement === "Creative",
    [nodeConfig?.enhancement]
  );

  // Collect image from connected image input
  const connectedImage = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    const incomingEdges = edges.filter(
      (edge) => edge.target === nodeId && edge.targetHandle === "image-input"
    );

    if (incomingEdges.length > 0) {
      const edge = incomingEdges[0];
      const sourceNode = nodes.find((node) => node.id === edge.source);
      return !!(sourceNode?.data?.imageDetails as ImageDetails | undefined)
        ?.downloads?.[0]?.url;
    }
    return false;
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

  const handleGenerate = useCallback(async () => {
    await handleUpscaleImage(nodeId);
  }, [nodeId]);

  const handleScaleFactorChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        scaleFactor: value as "2" | "4",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  const handleEnhancementChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        enhancement: value as "Resemblance" | "Balanced" | "Creative",
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
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

  const etaMs = useMemo(
    () => estimateMsForNode({ nodeType: "ai-image-upscaler-node", nodeConfig }),
    [nodeConfig]
  );

  return (
    <div className="py-6 h-full w-full overflow-auto flex flex-col gap-6">
      <div className="border-b border-border pb-4 px-4">
        <h2 className="text-[14px] font-semibold tracking-tight">
          Image Upscaler
        </h2>
      </div>

      {/* Scale Factor Dropdown */}
      <div className="flex flex-col gap-8 px-4">
        <CustomSelect
          label="Scale Factor"
          placeholder="Select scale"
          value={nodeConfig?.scaleFactor || "2"}
          defaultValue="2"
          onValueChange={handleScaleFactorChange}
          items={SCALE_FACTOR_OPTIONS}
        />

        {/* Enhancement Dropdown */}
        <CustomSelect
          label="Enhancement"
          placeholder="Select enhancement"
          value={nodeConfig?.enhancement || "Balanced"}
          defaultValue="Balanced"
          onValueChange={handleEnhancementChange}
          items={ENHANCEMENT_OPTIONS}
        />

        {/* Prompt Textarea - Conditional with Tooltip */}
        <div className="flex flex-col gap-3">
          <label className="text-xs ml-1 text-muted-foreground">
            Prompt {isPromptEnabled ? "(Creative)" : ""}
          </label>
          <TooltipProvider>
            <Tooltip open={!isPromptEnabled ? undefined : false}>
              <TooltipTrigger asChild>
                <div>
                  <MotionTextarea
                    value={nodeConfig?.prompt || ""}
                    onChange={handlePromptChange}
                    disabled={!isPromptEnabled}
                    placeholder={
                      isPromptEnabled
                        ? "Enter enhancement prompt here..."
                        : "Enable by selecting Creative enhancement"
                    }
                    minHeight={100}
                    animationDuration={0.15}
                    animationEase="easeOut"
                    className="disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </TooltipTrigger>
              {!isPromptEnabled && (
                <TooltipContent side="top">
                  <p>Select "Creative" enhancement to enable prompt</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
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
            !connectedImage ||
            (isPromptEnabled && !nodeConfig?.prompt?.trim())
          }
          className="w-full h-[32px]"
        />
      </div>
    </div>
  );
};

export default React.memo(AIImageUpscalerConfigSheet);
