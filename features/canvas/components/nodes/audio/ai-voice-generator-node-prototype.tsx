"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  memo,
  useMemo,
  useRef,
} from "react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { LoaderIcon } from "lucide-react";
import useFlowStore from "../../../stores/canvas-store";
import useConfigStore from "../../../stores/config-store";
import { cn } from "@/lib/utils";
import { NodeFlowConfig } from "../../../types/sidebar.types";
import CustomHandle from "../../shared/connections/custom-handle";
import { NodeAnimation } from "@/lib/animations/node-animation";
import GenerateButton, {
  type ButtonState,
} from "../../shared/generate-button/generate-button";
import { handleVoiceGeneratePrototype } from "../../../handlers/audio";
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
import {
  computeButtonState,
  useButtonStateWithAutoReset,
} from "../../../lib/shared";
import type { Edge } from "@xyflow/react";
import { PromptBlock } from "../../shared/blocks";
import { CustomSelect } from "../../shared/controls";
import { VOICE_OPTIONS } from "../../../constants/nodes/audio/ai-voice-generator-config";

type AIVoiceGeneratorNodePrototypeProps = {
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

const AIVoiceGeneratorNodePrototype: React.FC<AIVoiceGeneratorNodePrototypeProps> =
  memo(({ id, selected, dragging }) => {
    const updateNodeInternals = useUpdateNodeInternals();
    const setSelectedNodeId = useConfigStore(
      (state) => state.setSelectedNodeId
    );
    const nodeConfig = useConfigStore((state) => state.nodeConfigs?.[id]);
    const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

    // Stable selector for node data - prevents re-renders during drag
    const nodeDataRef = useRef<any>(undefined);
    const nodeDataRaw = useFlowStore((state) => {
      const node = state.nodes.find((n) => n.id === id);
      return node?.data;
    });
    const nodeData = useMemo(() => {
      if (nodeDataRaw !== nodeDataRef.current) {
        nodeDataRef.current = nodeDataRaw;
      }
      return nodeDataRef.current;
    }, [nodeDataRaw]);

    // Stable selector for edges - only updates when edges content changes
    const edgesRef = useRef<Edge[]>([]);
    const edgesIdsRef = useRef<string>("");
    const edgesRaw = useFlowStore((state) => state.edges);
    const edges = useMemo(() => {
      if (edgesRaw.length !== edgesRef.current.length) {
        const newIds = edgesRaw
          .map((e) => e.id)
          .sort()
          .join(",");
        edgesIdsRef.current = newIds;
        edgesRef.current = edgesRaw;
        return edgesRaw;
      }
      const newIds = edgesRaw
        .map((e) => e.id)
        .sort()
        .join(",");
      if (newIds !== edgesIdsRef.current) {
        edgesIdsRef.current = newIds;
        edgesRef.current = edgesRaw;
        return edgesRaw;
      }
      return edgesRef.current;
    }, [edgesRaw]);

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
      setIsNodeHovered,
      setIsGhostHovered,
      setIsGhostContainerHovered,
      setIsInputGhostHovered,
      isHovered,
    } = useNodeHoverState();

    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    const handleNodeClick = useCallback(() => {
      setSelectedNodeId(id);
    }, [id, setSelectedNodeId]);

    // Stable selector for prompt value
    const promptRef = useRef<string>("");
    const promptRaw = useFlowStore((state) => {
      const node = state.nodes.find((n) => n.id === id);
      return (node?.data?.prompt as string) || "";
    });
    const promptFromStore = useMemo(() => {
      if (promptRaw !== promptRef.current) {
        promptRef.current = promptRaw;
      }
      return promptRef.current;
    }, [promptRaw]);

    // Local state for typing
    const [prompt, setPrompt] = useState<string>(promptFromStore || "");

    // Sync local state when store data changes
    useEffect(() => {
      if (promptFromStore !== prompt) {
        setPrompt(promptFromStore);
      }
    }, [promptFromStore, prompt]);

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
      await handleVoiceGeneratePrototype(id);
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
        offset: 70, // Start at first handle
        height: flowConfig.inputs.length * 40 + 350, // Cover all handles + padding
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
        offset: 90, // Start at first handle
        height: flowConfig.outputs.length * 40 + 300, // Cover all handles + padding
      };
    }, [flowConfig?.outputs]);

    // Edge connection checks using Sets for O(1) lookups
    const outputConnections = useMemo(() => {
      if (!flowConfig?.outputs) return new Set<string>();
      return new Set(
        edges
          .filter((edge) => edge.source === id)
          .map((edge) => edge.sourceHandle || "")
      );
    }, [edges, id, flowConfig?.outputs]);

    const inputConnections = useMemo(() => {
      if (!flowConfig?.inputs) return new Set<string>();
      return new Set(
        edges
          .filter((edge) => edge.target === id)
          .map((edge) => edge.targetHandle || "")
      );
    }, [edges, id, flowConfig?.inputs]);

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

    return (
      <AudioPlayerProvider>
        <InputGhostNodeSuggestions
          nodeType="ai-voice-generator-node-prototype"
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
          nodeType="ai-voice-generator-node-prototype"
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

        <NodeAnimation>
          <div
            className={cn(
              "bg-popover rounded-xl p-4 min-w-[420px] border border-border cursor-pointer transition-[width,height] duration-300 ease-in-out",
              isNodeDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              ...(selected && {
                backgroundColor: "var(--node-selected)",
                borderColor: "var(--node-selected-border)",
              }),
            }}
            onMouseEnter={() => setIsNodeHovered(true)}
            onMouseLeave={() => setIsNodeHovered(false)}
            onClick={handleNodeClick}
            onMouseDown={(e) => {
              // Prevent node dragging when clicking on the embedded prompt area
              const target = e.target as HTMLElement;
              const isPromptArea = target.closest(
                '[data-embedded-prompt="true"]'
              );
              if (isPromptArea) {
                e.stopPropagation();
                e.nativeEvent.stopImmediatePropagation();
              }
            }}
          >
            {/* Node title */}
            <div className="text-body-desktop-medium mb-3">
              Generate Voice Prototype
            </div>

            {/* Embedded prompt */}
            <PromptBlock nodeId={id} prompt={prompt} className="mb-0" />

            {/* Embedded voice selector */}
            <CustomSelect
              placeholder="Voice"
              value={nodeConfig?.voiceName || "Elon Musk"}
              className="border-border bg-accent focus-visible:border-border mt-2.5 mb-3.5"
              defaultValue="Elon Musk"
              onValueChange={(value) => {
                updateNodeConfig(id, {
                  ...nodeConfig,
                  voiceName: value,
                });
              }}
              items={VOICE_OPTIONS}
            />

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
                state={finalButtonState}
                isLoading={isGenerating}
                disabled={isGenerating || isNodeDisabled}
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
                isConnected={outputConnections.has(output.id)}
              />
            ))}

            {flowConfig?.inputs.map((input, index) => (
              <CustomHandle
                key={input.id}
                config={input}
                isRequired={input.required}
                nodeId={id}
                index={index}
                handleType="input"
                baseOffset={50}
                spacing={40}
                labelOffsets={inputLabelOffsets}
                onSelected={selected}
                isHovered={isHovered}
                isConnected={inputConnections.has(input.id)}
              />
            ))}
          </div>
        </NodeAnimation>
      </AudioPlayerProvider>
    );
  });

AIVoiceGeneratorNodePrototype.displayName = "AIVoiceGeneratorNodePrototype";

export default AIVoiceGeneratorNodePrototype;
