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
import useFlowStore from "../../../stores/canvas-store";
import useConfigStore from "../../../stores/config-store";
import { cn } from "@/lib/utils";
import { NodeFlowConfig } from "../../../types/sidebar.types";
import CustomHandle from "../../shared/connections/custom-handle";

import { NodeAnimation } from "@/lib/animations/node-animation";
import GenerateButton, {
  ButtonState,
} from "../../shared/generate-button/generate-button";
import ImageDialog from "../../shared/dialogs/image-dialog";
import ImagePreview from "../../shared/assets/image-preview";
import { type ImageDetails } from "../../../lib/image";
import { handleImageGeneratePrototype } from "../../../handlers/image";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";
import { useNodeHoverState } from "../../../hooks/use-node-hover-state";
import InputGhostNodeSuggestions from "../../shared/ghost-nodes/input-ghost-node-suggestions";
import OutputGhostNodeSuggestions from "../../shared/ghost-nodes/output-ghost-node-suggestions";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
  getImagePreviewDimensions,
} from "../../../lib/shared";
import {
  useIsWalkthroughActive,
  useWalkthroughStepStates,
} from "../../../stores/walkthrough-store";
import type { Edge } from "@xyflow/react";
import { CustomSelect, AnimatedOrientationSelect } from "../../shared/controls";
import { STYLE_OPTIONS } from "../../../constants/nodes/image/image-generator-config";
import type { AIImageTool } from "../../../validations/image";
import { PromptBlock } from "../../shared/blocks";

type ImageGeneratorNodePrototypeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const ImageGeneratorNodePrototype: React.FC<ImageGeneratorNodePrototypeProps> =
  memo(({ id, selected, dragging }) => {
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const updateNodeInternals = useUpdateNodeInternals();
    const updateNodeData = useFlowStore((state) => state.updateNodeData);
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
    const isRequired = useMemo(
      () => flowConfig?.inputs.some((input) => input.required),
      [flowConfig]
    );

    const isWalkthroughNode = useMemo(
      () => nodeData?.isWalkthroughNode === true,
      [nodeData?.isWalkthroughNode]
    );

    // Batch step states to reduce subscription overhead
    const stepStates = useWalkthroughStepStates([5, 6, 7]);
    const walkthroughActiveRaw = useIsWalkthroughActive();

    const isStep5Active = isWalkthroughNode ? stepStates[5] : false;
    const isStep6Active = walkthroughActiveRaw ? stepStates[6] : false;
    const isStep7Active = walkthroughActiveRaw ? stepStates[7] : false;
    const isWalkthroughActive = walkthroughActiveRaw;

    const isWalkthroughHandle = useMemo(
      () => isStep5Active && isWalkthroughNode,
      [isStep5Active, isWalkthroughNode]
    );
    const isWalkthroughButton = useMemo(
      () => isStep6Active && isWalkthroughNode,
      [isStep6Active, isWalkthroughNode]
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
      setIsInputGhostHovered,
      isHovered,
    } = useNodeHoverState();

    useEffect(() => {
      updateNodeInternals(id);
    }, [id, updateNodeInternals]);

    const handleNodeClick = useCallback(() => {
      setSelectedNodeId(id);
    }, [id, setSelectedNodeId]);

    const handleImageClick = useCallback(() => {
      setIsImageDialogOpen(true);
    }, []);

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

    const imageDetails = useMemo(
      () => nodeData?.imageDetails as ImageDetails | undefined,
      [nodeData?.imageDetails]
    );

    // Container orientation - uses generatedOrientation if image exists to prevent layout changes mid-generation
    // This prevents visual layout updates when orientation changes if image already exists
    const orientation = useMemo(() => {
      // If image exists or generation is in progress, use the orientation stored when generation started
      if (imageDetails || nodeData?.generatedOrientation) {
        return (nodeData?.generatedOrientation ||
          nodeData?.orientation ||
          nodeConfig?.orientation ||
          "square") as "square" | "landscape" | "portrait";
      }
      // If no image and no generation in progress, use current node data orientation (from embedded selector)
      return (nodeData?.orientation || nodeConfig?.orientation || "square") as
        | "square"
        | "landscape"
        | "portrait";
    }, [
      imageDetails,
      nodeData?.generatedOrientation,
      nodeData?.orientation,
      nodeConfig?.orientation,
    ]);

    const imageUrl = useMemo(
      () => imageDetails?.downloads?.[0]?.url,
      [imageDetails]
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
      await handleImageGeneratePrototype(id);
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
        offset: 70, // Start at first handle
        height: flowConfig.outputs.length * 40 + 350, // Cover all handles + padding
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

    // Hide input ghost suggestions during walkthrough
    const shouldShowInputGhost = useMemo(() => {
      return !isWalkthroughActive;
    }, [isWalkthroughActive]);

    // Output ghost suggestions only show in step 7
    const shouldShowOutputGhost = useMemo(() => {
      if (isWalkthroughActive && !isStep7Active) {
        return false;
      }
      return true;
    }, [isWalkthroughActive, isStep7Active]);

    // Filter to only show video-generator-node in step 7
    const outputGhostFilter = useMemo(() => {
      if (!isStep7Active) return undefined;
      return (suggestion: any) =>
        suggestion.nodeType === "video-generator-node";
    }, [isStep7Active]);

    // Get image preview dimensions from shared utility
    const { previewDimensionsMap, containerDimensionsMap, containerOverhead } =
      getImagePreviewDimensions();

    // Calculate additional height for textarea (minHeight 120 + mb-3 = 12px spacing)
    const textareaHeight = 153 + 12; // 132px for textarea + margin

    // Calculate adjusted container dimensions that include textarea
    const adjustedContainerDimensions = useMemo(() => {
      return {
        square: {
          width: containerDimensionsMap.square.width,
          height: containerDimensionsMap.square.height + textareaHeight,
        },
        landscape: {
          width: containerDimensionsMap.landscape.width,
          height: containerDimensionsMap.landscape.height + textareaHeight,
        },
        portrait: {
          width: containerDimensionsMap.portrait.width,
          height: containerDimensionsMap.portrait.height + textareaHeight,
        },
      };
    }, [containerDimensionsMap, textareaHeight]);

    return (
      <>
        {shouldShowInputGhost && (
          <InputGhostNodeSuggestions
            nodeType="image-generator-node-prototype"
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
        )}

        {shouldShowOutputGhost && (
          <OutputGhostNodeSuggestions
            nodeType="image-generator-node-prototype"
            nodeId={id}
            flowConfig={flowConfig}
            edges={edges}
            isHovered={isStep7Active || isHovered}
            selected={selected}
            onHoverChange={(isOutputGhostHovered) => {
              setIsGhostHovered(isOutputGhostHovered);
              setIsGhostContainerHovered(isOutputGhostHovered);
            }}
            onNodeHoverChange={setIsNodeHovered}
            offset={outputHandleOffset}
            deadzoneOffset={outputDeadzoneConfig?.offset}
            deadzoneHeight={outputDeadzoneConfig?.height}
            forceShow={isStep7Active}
            filterSuggestions={outputGhostFilter}
          />
        )}

        <NodeAnimation>
          <div
            className={cn(
              "bg-popover p-4 border border-popover cursor-pointer transition-[width,height] duration-300 ease-in-out",
              isNodeDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              borderRadius: "14px",
              width: adjustedContainerDimensions[orientation].width,
              height: adjustedContainerDimensions[orientation].height,
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
              Generate Image Prototype
            </div>
            {/* Embedded prompt */}
            <PromptBlock nodeId={id} prompt={prompt} />

            {/* Mode Selector */}
            <CustomSelect
              placeholder="Art Style"
              value={nodeConfig?.style?.tool || "general"}
              className="border-border bg-accent focus-visible:border-border mt-2 mb-3.5"
              defaultValue="general"
              onValueChange={(value) => {
                updateNodeConfig(id, {
                  ...nodeConfig,
                  style: { ...nodeConfig?.style, tool: value as AIImageTool },
                });
              }}
              items={STYLE_OPTIONS}
            />

            {/* Generated Image Preview */}
            <ImagePreview
              imageUrl={imageUrl}
              isGenerating={isGenerating}
              onImageClick={handleImageClick}
              orientation={orientation}
              height={previewDimensionsMap[orientation].height}
            />
            {/* Generate button and auto-run */}
            <div className="flex items-center justify-end mt-4 gap-2">
              <AnimatedOrientationSelect
                value={
                  nodeData?.orientation || nodeConfig?.orientation || "square"
                }
                onChange={(value) => {
                  updateNodeData(id, { orientation: value });
                }}
              />
              <GenerateButton
                onClick={handleGenerate}
                state={finalButtonState}
                isLoading={isGenerating}
                disabled={isGenerating || isNodeDisabled}
                isWalkthrough={isWalkthroughButton}
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
                labelOffsets={{
                  Image: { horizontal: "-2.5rem" },
                  Video: { horizontal: "-2.3rem" },
                }}
                onSelected={selected}
                isHovered={isHovered}
                isConnected={outputConnections.has(output.id)}
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
                labelOffsets={{
                  Prompt: { horizontal: "-2.65rem" },
                }}
                onSelected={selected}
                isHovered={isHovered}
                isConnected={inputConnections.has(input.id)}
                isWalkthrough={
                  isWalkthroughHandle && input.dataType === "string"
                }
              />
            ))}
          </div>
        </NodeAnimation>

        {/* Image Dialog */}
        <ImageDialog
          isOpen={isImageDialogOpen}
          imageUrl={imageUrl}
          onClose={() => setIsImageDialogOpen(false)}
        />
      </>
    );
  });

ImageGeneratorNodePrototype.displayName = "ImageGeneratorNodePrototype";

export default ImageGeneratorNodePrototype;
