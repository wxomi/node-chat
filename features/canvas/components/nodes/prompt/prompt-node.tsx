"use client";

import React, {
  useCallback,
  useEffect,
  memo,
  useMemo,
  useState,
  useRef,
} from "react";
import { motion } from "motion/react";
import { useUpdateNodeInternals } from "@xyflow/react";
import useFlowStore from "../../../stores/canvas-store";
import useConfigStore from "../../../stores/config-store";
import CustomHandle from "../../shared/connections/custom-handle";
import { NodeAnimation } from "@/lib/animations/node-animation";
import { MotionTextarea } from "@/components/ui/motion-textarea";
import { NodeFlowConfig } from "../../../types/sidebar.types";
import { cn } from "@/lib/utils";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";
import { useNodeHoverState } from "../../../hooks/use-node-hover-state";
import type { PromptNodeData } from "../../../validations/prompt";
import OutputGhostNodeSuggestions from "../../shared/ghost-nodes/output-ghost-node-suggestions";
import {
  useIsWalkthroughActive,
  useWalkthroughStepStates,
} from "../../../stores/walkthrough-store";
import type { Edge } from "@xyflow/react";

type PromptNodeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const PromptNode: React.FC<PromptNodeProps> = memo(({ id, selected }) => {
  const updateNodeData = useFlowStore((state) => state.updateNodeData);

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

  const updateNodeInternals = useUpdateNodeInternals();
  const setSelectedNodeId = useConfigStore((state) => state.setSelectedNodeId);

  const flowConfig = useMemo(
    () => nodeData?.flowConfig as NodeFlowConfig | null,
    [nodeData?.flowConfig]
  );
  const isRequired = useMemo(
    () => flowConfig?.inputs.some((input) => input.required) ?? false,
    [flowConfig]
  );

  const isWalkthroughNode = useMemo(
    () => nodeData?.isWalkthroughNode === true,
    [nodeData?.isWalkthroughNode]
  );

  // Batch step states to reduce subscription overhead
  const stepStates = useWalkthroughStepStates([5]);
  const walkthroughActiveRaw = useIsWalkthroughActive();

  const isStep5Active = isWalkthroughNode ? stepStates[5] : false;
  const isWalkthroughActive = isWalkthroughNode ? walkthroughActiveRaw : false;

  const isWalkthroughHandle = useMemo(
    () => isStep5Active && isWalkthroughNode,
    [isStep5Active, isWalkthroughNode]
  );

  // Get node disabled state based on connection compatibility
  const { isNodeDisabled } = useNodeDisabledState({
    nodeId: id,
    flowConfig,
  });

  const {
    setIsNodeHovered,
    setIsGhostHovered,
    setIsGhostContainerHovered,
    isHovered,
  } = useNodeHoverState();

  // Stable selector for prompt value
  const promptRef = useRef<string>("");
  const promptRaw = useFlowStore((state) => {
    const node = state.nodes.find((n) => n.id === id);
    const promptValue = (node?.data as PromptNodeData)?.prompt ?? "";
    console.log(
      `[prompt-node] Reading prompt for node ${id}:`,
      promptValue,
      "Full node data:",
      node?.data
    );
    return promptValue;
  });
  const promptFromStore = useMemo(() => {
    if (promptRaw !== promptRef.current) {
      promptRef.current = promptRaw;
    }
    return promptRef.current;
  }, [promptRaw]);

  // Local state for typing
  const [prompt, setPrompt] = useState<string>(promptFromStore || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync local state when store data changes
  useEffect(() => {
    console.log(
      `[prompt-node] useEffect sync - promptFromStore:`,
      promptFromStore,
      "current prompt:",
      prompt
    );
    if (promptFromStore !== prompt) {
      setPrompt(promptFromStore);
    }
  }, [promptFromStore]);

  // Update node internals when flowConfig changes or component mounts
  useEffect(() => {
    if (flowConfig) {
      updateNodeInternals(id);
    }
  }, [flowConfig, id, updateNodeInternals]);

  // Also update node internals on mount to ensure handle positions are registered
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, updateNodeInternals]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setPrompt(e.target.value);
    },
    []
  );

  const handleBlur = useCallback(() => {
    // Save to store when textarea loses focus
    updateNodeData(id, { prompt });
  }, [id, prompt, updateNodeData]);

  const handleNodeClick = () => {
    setSelectedNodeId(id);
  };

  // Calculate offset for output ghost suggestions (10px below last output handle)
  const outputHandleOffset = useMemo(() => {
    if (!flowConfig?.outputs || flowConfig.outputs.length === 0)
      return undefined;
    const baseOffset = 30;
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
      height: flowConfig.outputs.length * 40 + 100, // Cover all handles + padding
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

  const shouldShowGhostSuggestions = useMemo(
    () => !isWalkthroughActive,
    [isWalkthroughActive]
  );

  return (
    <>
      {shouldShowGhostSuggestions && (
        <OutputGhostNodeSuggestions
          nodeType="text-node"
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
      )}
      <NodeAnimation>
        <motion.div
          className={cn(
            "bg-popover rounded-xl p-4 min-w-[420px] border border-popover cursor-pointer",
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
        >
          {/* Node title */}
          <div className="text-body-desktop-medium mb-3">Prompt</div>

          {/* Prompt textarea */}
          <MotionTextarea
            ref={textareaRef}
            value={prompt || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter your prompt here..."
            minHeight={160}
            animationDuration={0.15}
            animationEase="easeOut"
          />

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
              labelOffsets={{
                Prompt: { horizontal: "-2.9rem" },
              }}
              onSelected={selected}
              isHovered={isHovered}
              isConnected={outputConnections.has(output.id)}
              isWalkthrough={isWalkthroughHandle}
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
              onSelected={selected}
              isHovered={isHovered}
              isConnected={inputConnections.has(input.id)}
            />
          ))}
        </motion.div>
      </NodeAnimation>
    </>
  );
});

PromptNode.displayName = "PromptNode";

export default PromptNode;
