"use client";

import React, { useCallback, useMemo } from "react";
import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import GenerateButton, {
  type ButtonState,
} from "../shared/generate-button/generate-button";
import { MotionTextarea } from "@/components/ui/motion-textarea";
import { CustomSelect } from "../shared/controls";
import { VOICE_OPTIONS } from "../../constants/nodes/audio/ai-voice-generator-config";
import { handleVoiceGenerate } from "../../handlers/audio";
import { estimateMsForNode, formatEta } from "../../lib/shared";
import type { AIVoiceGeneratorNodeConfig } from "../../validations/audio";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
  type AssetDetails,
} from "../../lib/shared";

type AIVoiceGeneratorConfigSheetProps = {
  nodeId: string;
};

const AIVoiceGeneratorConfigSheet: React.FC<
  AIVoiceGeneratorConfigSheetProps
> = ({ nodeId }) => {
  // Subscribe to config for this node (cast to AIVoiceGeneratorNodeConfig)
  const nodeConfig = useConfigStore(
    (state) =>
      state.nodeConfigs?.[nodeId] as AIVoiceGeneratorNodeConfig | undefined
  );
  const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

  // Only subscribe to node DATA, not position changes
  const nodeData = useFlowStore((s) => {
    const node = s.nodes.find((n) => n.id === nodeId);
    return node?.data;
  });

  const edges = useFlowStore((state) => state.edges);

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

  // Get typed prompt from config
  const typedPrompt = useMemo(
    () => nodeConfig?.prompt || "",
    [nodeConfig?.prompt]
  );

  // Compose full prompt display
  const fullPrompt = useMemo(() => {
    const prompts = [connectedPrompt, typedPrompt].filter(
      (p) => p.trim() !== ""
    );
    return prompts.join("\n");
  }, [connectedPrompt, typedPrompt]);

  const audioDetails = useMemo(
    () => nodeData?.audioDetails as AssetDetails | undefined,
    [nodeData?.audioDetails]
  );

  const isGenerating = useMemo(
    () => !!(nodeData?.generatedAudioId && !audioDetails),
    [nodeData?.generatedAudioId, audioDetails]
  );

  // Compute button state using utility function
  const computedButtonState = useMemo<ButtonState>(
    () =>
      computeButtonState(
        nodeData?.generatedAudioId as string | undefined,
        audioDetails
      ),
    [nodeData?.generatedAudioId, audioDetails]
  );

  // Apply auto-reset logic from completed to idle
  const finalButtonState = useButtonStateWithAutoReset(computedButtonState);

  const handleGenerate = useCallback(async () => {
    await handleVoiceGenerate(nodeId);
  }, [nodeId]);

  const etaMs = useMemo(
    () =>
      estimateMsForNode({ nodeType: "ai-voice-generator-node", nodeConfig }),
    [nodeConfig]
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

  const handleVoiceChange = useCallback(
    (value: string) => {
      updateNodeConfig(nodeId, {
        ...(nodeConfig || {}),
        voiceName: value as any,
      });
    },
    [nodeId, nodeConfig, updateNodeConfig]
  );

  return (
    <div className="py-6 h-full w-full overflow-auto flex flex-col gap-6">
      <div className="border-b border-border pb-4 px-4">
        <h2 className="text-[14px] font-semibold tracking-tight">
          AI Voice Generator
        </h2>
      </div>

      {/* Voice selection */}
      <div className="px-4">
        <CustomSelect
          label="Voice"
          placeholder="Select voice"
          value={nodeConfig?.voiceName || "Elon Musk"}
          defaultValue="Elon Musk"
          onValueChange={handleVoiceChange}
          items={VOICE_OPTIONS}
        />
      </div>

      {/* Prompt display and edit */}
      <div className="flex flex-col gap-3 px-4">
        <label className="text-xs ml-1 text-muted-foreground">
          Prompt {connectedPrompt && "(+ connected)"}
        </label>
        <MotionTextarea
          value={typedPrompt}
          onChange={handlePromptChange}
          placeholder={
            connectedPrompt
              ? "Add additional prompt (will be combined with connected prompt)..."
              : "Enter prompt here..."
          }
          minHeight={120}
          animationDuration={0.15}
          animationEase="easeOut"
        />
        {connectedPrompt && (
          <div className="text-xs text-muted-foreground bg-accent/30 rounded p-2 border border-border/50">
            Connected: {connectedPrompt}
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
          disabled={isGenerating || (!connectedPrompt && !typedPrompt)}
          className="w-full h-[32px]"
        />
      </div>
    </div>
  );
};

export default React.memo(AIVoiceGeneratorConfigSheet);
