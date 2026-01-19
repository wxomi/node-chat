"use client";

import React, { useState, useRef, useCallback, memo, useEffect } from "react";
import { motion } from "motion/react";
import { useUpdateNodeInternals } from "@xyflow/react";
import { MotionTextarea } from "@/components/ui/motion-textarea";
import useFlowStore from "../../../stores/canvas-store";
import useConfigStore from "../../../stores/config-store";
import { type PromptEnhancerNodeData } from "../../../validations/prompt";
import { cn } from "@/lib/utils";
import GenerateButton from "../../shared/generate-button/generate-button";
import { NodeFlowConfig } from "../../../types/sidebar.types";
import CustomHandle from "../../shared/connections/custom-handle";
import { NodeAnimation } from "@/lib/animations/node-animation";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";

type PromptEnhancerNodeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const PromptEnhancerNode: React.FC<PromptEnhancerNodeProps> = memo(
  ({ id, selected, dragging }) => {
    const updateNodeData = useFlowStore((state) => state.updateNodeData);
    const edges = useFlowStore((state) => state.edges);
    const updateNodeInternals = useUpdateNodeInternals();
    const setSelectedNodeId = useConfigStore(
      (state) => state.setSelectedNodeId
    );

    // Get the node and its flow configuration
    const node = useFlowStore((state) => state.nodes.find((n) => n.id === id));
    const flowConfig = node?.data?.flowConfig as NodeFlowConfig | null;
    const isRequired = flowConfig?.inputs.some((input) => input.required);

    // Get node disabled state based on connection compatibility
    const { isNodeDisabled } = useNodeDisabledState({
      nodeId: id,
      flowConfig,
    });

    // Track hover state
    const [isHovered, setIsHovered] = useState<boolean>(false);
    // Subscribe to only the prompt value instead of entire node array
    const promptFromStore = useFlowStore(
      useCallback(
        (s) =>
          (s.nodes.find((n) => n.id === id)?.data as PromptEnhancerNodeData)
            ?.prompt ?? "",
        [id]
      )
    );

    // Local state for typing
    const [prompt, setPrompt] = useState<string>(promptFromStore || "");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync local state when store data changes
    useEffect(() => {
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

    return (
      <NodeAnimation>
        <motion.div
          className={cn(
            "bg-popover border border-border rounded-xl p-4 min-w-[420px] cursor-pointer",
            isNodeDisabled && "opacity-50 cursor-not-allowed"
          )}
          style={{
            ...(selected && {
              backgroundColor: "var(--node-selected)",
              borderColor: "var(--node-selected-border)",
            }),
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleNodeClick}
        >
          {/* Node title */}
          <div className="text-body-desktop-medium mb-3">Prompt Enhancer</div>

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

          {/* generate button */}
          <GenerateButton />

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
              onSelected={selected}
              isHovered={isHovered}
              isConnected={edges.some(
                (edge) => edge.source === id && edge.sourceHandle === output.id
              )}
            />
          ))}

          {flowConfig?.inputs.map((input, index) => (
            <CustomHandle
              key={input.id}
              config={input}
              nodeId={id}
              index={index}
              handleType="input"
              isRequired={isRequired}
              baseOffset={50}
              spacing={40}
              onSelected={selected}
              isHovered={isHovered}
              isConnected={edges.some(
                (edge) => edge.target === id && edge.targetHandle === input.id
              )}
            />
          ))}
        </motion.div>
      </NodeAnimation>
    );
  }
);

PromptEnhancerNode.displayName = "PromptEnhancerNode";

export default PromptEnhancerNode;
