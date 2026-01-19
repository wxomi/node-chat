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
  type ButtonState,
} from "../../shared/generate-button/generate-button";
import ImageDialog from "../../shared/dialogs/image-dialog";
import ImagePreview from "../../shared/assets/image-preview";
import { type ImageDetails } from "../../../lib/image";
import { handleAIImageEditPrototype } from "../../../handlers/image";
import ConnectedAssetDisplay from "../../shared/assets/connected-asset-display";
import { useNodeDisabledState } from "../../../hooks/use-node-disabled-state";
import { useNodeHoverState } from "../../../hooks/use-node-hover-state";
import InputGhostNodeSuggestions from "../../shared/ghost-nodes/input-ghost-node-suggestions";
import OutputGhostNodeSuggestions from "../../shared/ghost-nodes/output-ghost-node-suggestions";
import {
  computeButtonState,
  useButtonStateWithAutoReset,
  getImagePreviewDimensions,
  getDimensionsFromSource,
  calculateCustomContainerDimensions,
} from "../../../lib/shared";
import type { Edge } from "@xyflow/react";
import { PromptBlock } from "../../shared/blocks";

type AIImageEditorNodePrototypeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const AIImageEditorNodePrototype: React.FC<AIImageEditorNodePrototypeProps> =
  memo(({ id, selected, dragging }) => {
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const updateNodeInternals = useUpdateNodeInternals();
    const updateNodeData = useFlowStore((state) => state.updateNodeData);
    const setSelectedNodeId = useConfigStore(
      (state) => state.setSelectedNodeId
    );
    const nodeConfig = useConfigStore((state) => state.nodeConfigs?.[id]);

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

    // Memoize connected assets to prevent constant recomputation
    const connectedAssets = useMemo(() => {
      const assets: Record<string, any> = {};

      flowConfig?.inputs.forEach((input) => {
        const connectedEdge = edges.find(
          (edge) => edge.target === id && edge.targetHandle === input.id
        );

        if (connectedEdge) {
          const sourceNode = useFlowStore
            .getState()
            .nodes.find((n) => n.id === connectedEdge.source);
          if (sourceNode?.data?.uploadedAssets) {
            const asset = (sourceNode.data.uploadedAssets as any[]).find(
              (a: any) => a.id === connectedEdge.sourceHandle
            );
            assets[input.id] = asset || null;
          } else {
            assets[input.id] = null;
          }
        } else {
          assets[input.id] = null;
        }
      });

      return assets;
    }, [edges, flowConfig?.inputs, id]);

    // Extract source dimensions from connected upload node for image-input
    const sourceDimensions = useMemo(() => {
      const imageInput = flowConfig?.inputs.find(
        (input) => input.id === "image-input" && input.dataType === "image"
      );
      if (!imageInput) return null;

      return getDimensionsFromSource(id, imageInput.id, edges);
    }, [edges, flowConfig?.inputs, id]);

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

    const imageUrl = useMemo(
      () => imageDetails?.downloads?.[0]?.url,
      [imageDetails]
    );

    const isGenerating = useMemo(
      () => !!(nodeData?.generatedImageId && !imageDetails),
      [nodeData?.generatedImageId, imageDetails]
    );

    // Use stored orientation if image exists or generation is in progress, otherwise use source orientation
    // This prevents visual updates when orientation changes if image already exists
    const orientation = useMemo(() => {
      // If image exists or generation is in progress, use the orientation stored when generation started
      if (imageDetails || nodeData?.generatedOrientation) {
        return (nodeData?.generatedOrientation ||
          nodeConfig?.orientation ||
          "square") as "square" | "landscape" | "portrait";
      }
      // If no image and no generation in progress, use current config orientation (from source)
      return (nodeConfig?.orientation || "square") as
        | "square"
        | "landscape"
        | "portrait";
    }, [imageDetails, nodeData?.generatedOrientation, nodeConfig?.orientation]);

    // Get image preview dimensions from shared utility
    const { previewDimensionsMap, containerDimensionsMap, containerOverhead } =
      getImagePreviewDimensions();

    // Calculate custom container dimensions based on source aspect ratio
    // Only use source dimensions if generation has started (generatedOrientation exists)
    // This ensures container size only changes when generate button is clicked, not on connection
    const customContainerDimensions = useMemo(() => {
      return calculateCustomContainerDimensions(
        sourceDimensions,
        containerOverhead,
        !!nodeData?.generatedOrientation
      );
    }, [sourceDimensions, containerOverhead, nodeData?.generatedOrientation]);

    // Calculate additional height for textarea (minHeight 120 + mb-3 = 12px spacing)
    const textareaHeight = 100 + 12; // 162px for textarea + margin

    // Calculate adjusted container dimensions that include textarea
    const adjustedContainerDimensions = useMemo(() => {
      const baseDimensions =
        customContainerDimensions || containerDimensionsMap[orientation];
      return {
        square: {
          width: baseDimensions.width,
          height: baseDimensions.height + textareaHeight,
        },
        landscape: {
          width: baseDimensions.width,
          height: baseDimensions.height + textareaHeight,
        },
        portrait: {
          width: baseDimensions.width,
          height: baseDimensions.height + textareaHeight,
        },
      };
    }, [
      customContainerDimensions,
      containerDimensionsMap,
      orientation,
      textareaHeight,
    ]);

    // Use adjusted dimensions for final container
    const finalContainerDimensions = useMemo(() => {
      return adjustedContainerDimensions[orientation];
    }, [adjustedContainerDimensions, orientation]);

    // Calculate preview height for ImagePreview component
    const previewHeight = useMemo(() => {
      if (customContainerDimensions) {
        return customContainerDimensions.height - containerOverhead.total;
      }
      return previewDimensionsMap[orientation].height;
    }, [
      customContainerDimensions,
      containerOverhead,
      previewDimensionsMap,
      orientation,
    ]);

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
      await handleAIImageEditPrototype(id);
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
        offset: 120, // Start at first handle
        height: flowConfig.inputs.length * 40 + 300 + textareaHeight, // Cover all handles + padding + textarea
      };
    }, [flowConfig?.inputs, textareaHeight]);

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

    return (
      <>
        <InputGhostNodeSuggestions
          nodeType="ai-image-editor-node-prototype"
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
          nodeType="ai-image-editor-node-prototype"
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
              "bg-popover p-4 border border-popover cursor-pointer transition-[width,height] duration-300 ease-in-out",
              isNodeDisabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
              borderRadius: "14px",
              width: finalContainerDimensions.width,
              height: finalContainerDimensions.height,
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
              Edit Image Prototype
            </div>

            {/* Embedded prompt */}
            <PromptBlock nodeId={id} prompt={prompt} className="mb-2" />

            {/* Memoized image preview component */}
            <ImagePreview
              imageUrl={imageUrl}
              isGenerating={isGenerating}
              onImageClick={handleImageClick}
              orientation={orientation}
              height={previewHeight}
            />

            {/* Generate button and connected assets */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-row gap-2 h-6">
                {flowConfig?.inputs.map((input) => (
                  <ConnectedAssetDisplay
                    key={input.id}
                    connectedAsset={connectedAssets[input.id]}
                    disabled={false}
                  />
                ))}
              </div>
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
                isRequired={input.required}
                nodeId={id}
                index={index}
                handleType="input"
                baseOffset={50}
                spacing={40}
                labelOffsets={{
                  Image: { horizontal: "-2.5rem" },
                  Prompt: { horizontal: "-2.65rem" },
                  Video: { horizontal: "-2.4rem" },
                }}
                onSelected={selected}
                isHovered={isHovered}
                isConnected={inputConnections.has(input.id)}
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

AIImageEditorNodePrototype.displayName = "AIImageEditorNodePrototype";

export default AIImageEditorNodePrototype;
