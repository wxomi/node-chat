"use client";

import React, { useState, useCallback, useEffect, memo, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { LoaderIcon } from "lucide-react";
import useFlowStore from "../../../stores/canvas-store";
import useConfigStore from "../../../stores/config-store";
import { cn } from "@/lib/utils";
import { NodeFlowConfig } from "../../../types/sidebar.types";
import CustomHandle from "../../shared/connections/custom-handle";
import { NodeAnimation } from "@/lib/animations/node-animation";
import GenerateButton from "../../shared/generate-button/generate-button";
import { handleVoiceGenerate } from "../../../handlers/audio";
import {
  AudioPlayerButton,
  AudioPlayerDuration,
  AudioPlayerProgress,
  AudioPlayerProvider,
  AudioPlayerTime,
} from "@/components/ui/audio-player";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";
import { useNodeHoverState } from "../../../hooks/use-node-hover-state";
import InputGhostNodeSuggestions from "../../shared/ghost-nodes/input-ghost-node-suggestions";
import OutputGhostNodeSuggestions from "../../shared/ghost-nodes/output-ghost-node-suggestions";

type AIVoiceGeneratorNodeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

// Memoized loading component to prevent re-renders
const LoadingState = memo(() => (
  <div className="bg-accent rounded-lg p-3 border border-border">
    <div className="flex items-center justify-center gap-2 h-[32px]">
      <LoaderIcon className="text-secondary-foreground size-4 animate-spin" />
      <span className="text-xs text-secondary-foreground">Generating...</span>
    </div>
  </div>
));
LoadingState.displayName = "LoadingState";

// Memoized placeholder component
const PlaceholderState = memo(() => (
  <div className="bg-accent rounded-lg p-3 border border-border">
    <div className="flex items-center justify-center h-[32px]">
      <span className="text-xs text-muted-foreground">No audio generated</span>
    </div>
  </div>
));
PlaceholderState.displayName = "PlaceholderState";

// Memoized audio player component
const AudioPlayerState = memo<{ audioUrl: string }>(({ audioUrl }) => (
  <div className="bg-accent rounded-lg p-3 border border-border">
    <div className="flex items-center gap-3">
      <AudioPlayerButton
        src={audioUrl}
        size="icon-sm"
        className="bg-[#1e1f32] text-white border border-border cursor-pointer hover:bg-[#1a1b2e]"
      />
      <div className="flex items-center gap-2 flex-1">
        <AudioPlayerTime className="text-xs text-muted-foreground" />
        <AudioPlayerProgress className="flex-1 [&_.bg-muted]:bg-muted [&_.bg-primary]:bg-primary [&_.bg-foreground]:bg-primary" />
        <AudioPlayerDuration className="text-xs text-muted-foreground" />
      </div>
    </div>
  </div>
));
AudioPlayerState.displayName = "AudioPlayerState";

const AIVoiceGeneratorNode: React.FC<AIVoiceGeneratorNodeProps> = memo(
  ({ id, selected, dragging }) => {
    const updateNodeInternals = useUpdateNodeInternals();
    const setSelectedNodeId = useConfigStore(
      (state) => state.setSelectedNodeId
    );

    // Only subscribe to node DATA, not position changes
    const nodeData = useFlowStore((s) => {
      const node = s.nodes.find((n) => n.id === id);
      return node?.data;
    });

    const edges = useFlowStore((s) => s.edges);

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

    const {
      isNodeHovered,
      setIsNodeHovered,
      isGhostHovered,
      setIsGhostHovered,
      isGhostContainerHovered,
      setIsGhostContainerHovered,
      isInputGhostHovered,
      setIsInputGhostHovered,
      isHovered,
    } = useNodeHoverState();

    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    const handleNodeClick = useCallback(() => {
      setSelectedNodeId(id);
    }, [id, setSelectedNodeId]);

    const audioDetails = useMemo(
      () => nodeData?.audioDetails,
      [nodeData?.audioDetails]
    );

    const audioUrl = useMemo(
      () => (audioDetails as any)?.downloads?.[0]?.url,
      [audioDetails]
    );

    const isGenerating = useMemo(
      () => !!(nodeData?.generatedAudioId && !audioDetails),
      [nodeData?.generatedAudioId, audioDetails]
    );

    const handleGenerate = useCallback(async () => {
      await handleVoiceGenerate(id);
    }, [id]);

    // Memoized label offsets to prevent object recreation
    const outputLabelOffsets = useMemo(
      () => ({
        Audio: { horizontal: "-2.3rem" },
        Video: { horizontal: "-2.3rem" },
      }),
      []
    );

    const inputLabelOffsets = useMemo(
      () => ({
        Prompt: { horizontal: "-2.65rem" },
        Audio: { horizontal: "-2.4rem" },
      }),
      []
    );

    // Memoized connected state for handles
    const outputConnectedStates = useMemo(
      () =>
        flowConfig?.outputs.map((output) =>
          edges.some(
            (edge) => edge.source === id && edge.sourceHandle === output.id
          )
        ) || [],
      [flowConfig?.outputs, edges, id]
    );

    const inputConnectedStates = useMemo(
      () =>
        flowConfig?.inputs.map((input) =>
          edges.some(
            (edge) => edge.target === id && edge.targetHandle === input.id
          )
        ) || [],
      [flowConfig?.inputs, edges, id]
    );

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
        offset: 70, // Start at first handle
        height: flowConfig.inputs.length * 40 + 60, // Cover all handles + padding
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
      return lastHandlePosition + 10; // 10px below last handle
    }, [flowConfig?.outputs]);

    // Calculate deadzone config for output handles (start at first handle, cover all handles + padding)
    const outputDeadzoneConfig = useMemo(() => {
      if (!flowConfig?.outputs || flowConfig.outputs.length === 0)
        return undefined;
      return {
        offset: 70, // Start at first handle
        height: flowConfig.outputs.length * 40 + 60, // Cover all handles + padding
      };
    }, [flowConfig?.outputs]);

    // Memoized mouse handlers to prevent function recreation
    const handleMouseEnter = useCallback(() => setIsNodeHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsNodeHovered(false), []);

    return (
      <AudioPlayerProvider>
        <InputGhostNodeSuggestions
          nodeType="ai-voice-generator-node"
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
          nodeType="ai-voice-generator-node"
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
          deadzoneWidth={48}
          animationOffsetX={48}
        />

        <NodeAnimation>
          <motion.div
            className={cn(
              "bg-popover rounded-xl p-4 min-w-[420px] border border-border cursor-pointer",
              isNodeDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              willChange: "transform",
              ...(selected && {
                backgroundColor: "var(--node-selected)",
                borderColor: "var(--node-selected-border)",
              }),
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleNodeClick}
          >
            {/* Node title */}
            <div className="text-body-desktop-medium mb-3">Generate Voice</div>

            {/* Audio preview */}
            <div className="mb-4">
              {isGenerating ? (
                <LoadingState />
              ) : audioUrl ? (
                <AudioPlayerState audioUrl={audioUrl} />
              ) : (
                <PlaceholderState />
              )}
            </div>

            {/* Generate button */}
            <div className="flex justify-end">
              <GenerateButton
                onClick={handleGenerate}
                isLoading={isGenerating}
                disabled={isGenerating}
              />
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
                spacing={40}
                labelOffsets={outputLabelOffsets}
                onSelected={selected}
                isHovered={isHovered}
                isConnected={outputConnectedStates[index]}
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
                labelOffsets={inputLabelOffsets}
                onSelected={selected}
                isHovered={isHovered}
                isConnected={inputConnectedStates[index]}
              />
            ))}
          </motion.div>
        </NodeAnimation>
      </AudioPlayerProvider>
    );
  }
);

AIVoiceGeneratorNode.displayName = "AIVoiceGeneratorNode";

export default AIVoiceGeneratorNode;
