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
import { handleFaceSwapPrototype } from "../../../handlers/image";
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
import { SettingsIcon } from "@/constants/icons";
import Image from "next/image";
import type { Edge } from "@xyflow/react";
import { CustomSelect } from "../../shared/controls";
import { FACE_SWAP_MODE_OPTIONS } from "../../../constants/nodes/image/face-swap-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "motion/react";
import { Kbd } from "@/components/ui/kbd";

type FaceSwapNodePrototypeProps = {
  id: string;
  selected?: boolean;
  dragging?: boolean;
};

const FaceSwapNodePrototype: React.FC<FaceSwapNodePrototypeProps> = memo(
  ({ id, selected, dragging }) => {
    const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
    const updateNodeInternals = useUpdateNodeInternals();
    const updateNodeData = useFlowStore((state) => state.updateNodeData);
    const selectNode = useFlowStore((state) => state.selectNode);
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

    // Extract source dimensions from connected upload node for target-face-input
    // Face swap uses target image dimensions (target determines output orientation)
    const sourceDimensions = useMemo(() => {
      const targetFaceInput = flowConfig?.inputs.find(
        (input) =>
          input.id === "target-face-input" && input.dataType === "image"
      );
      if (!targetFaceInput) return null;

      return getDimensionsFromSource(id, targetFaceInput.id, edges);
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

    const setSettingsNodeId = useConfigStore(
      (state) => state.setSettingsNodeId
    );
    const settingsNodeId = useConfigStore((state) => state.settingsNodeId);

    const handleSettingsClick = useCallback(
      (e: React.MouseEvent) => {
        // Track panel state: in view (slid in) vs slid out
        const isPanelInView = selected; // Panel is in view when node is selected
        const isPanelMaximized = settingsNodeId === id; // Panel is maximized when settingsNodeId matches

        if (!isPanelInView) {
          // Panel is slid out, bring it into view and maximize it
          selectNode(id);
          // selects the node and shows the settings panel
          setSelectedNodeId(id);
          // maximises the panel
          setSettingsNodeId(id);
        } else if (isPanelMaximized) {
          // Panel is in view and maximized, minimize it
          setSettingsNodeId(null);
        } else {
          // Panel is in view but minimized, maximize it
          setSettingsNodeId(id);
        }
      },
      [
        id,
        selected,
        settingsNodeId,
        setSettingsNodeId,
        setSelectedNodeId,
        selectNode,
      ]
    );

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
    // Face swap uses target-face-input for orientation (target image determines output orientation)
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

    // Calculate additional height for face swap mode selector
    // CustomSelect height is ~24px (h-6) + mt-2 (8px) + mb-3.5 (14px) = ~46px
    const selectorHeight = 58;

    // Calculate adjusted container dimensions that include selector
    const adjustedContainerDimensions = useMemo(() => {
      const baseDimensions =
        customContainerDimensions || containerDimensionsMap[orientation];
      return {
        width: baseDimensions.width,
        height: baseDimensions.height + selectorHeight,
      };
    }, [
      customContainerDimensions,
      containerDimensionsMap,
      orientation,
      selectorHeight,
    ]);

    // Use adjusted dimensions for final container
    const finalContainerDimensions = useMemo(() => {
      return adjustedContainerDimensions;
    }, [adjustedContainerDimensions]);

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
      await handleFaceSwapPrototype(id);
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

    return (
      <>
        <InputGhostNodeSuggestions
          nodeType="face-swap-node-prototype"
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
          nodeType="face-swap-node-prototype"
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
              isNodeDisabled && "opacity-50 cursor-not-allowed",
              selected && "ring-1 ring-offset-3 ring-offset-muted ring-border"
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
          >
            {/* node header */}
            <div className="flex justify-between items-center mb-3">
              {/* Node title */}
              <div className="text-body-desktop-medium">
                Swap Face in Image Prototype
              </div>
              {/* advanced settings cog icon  */}
              <Tooltip delayDuration={600}>
                <TooltipTrigger asChild>
                  <motion.div
                    whileHover={{ rotate: 90, scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 15,
                      mass: 2,
                    }}
                    className="focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={handleSettingsClick}
                  >
                    <Image
                      src={SettingsIcon}
                      alt="Settings"
                      width={14}
                      height={14}
                      className="cursor-pointer hover:brightness-0 hover:invert focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent
                  className="bg-muted text-white text-caption-desktop-regular py-1 px-3 rounded-md border border-border flex items-center gap-2"
                  side="top"
                  align="center"
                  sideOffset={12}
                >
                  <p>Advanced Settings</p>
                  <div className="flex items-center gap-1">
                    <Kbd className="h-4 text-[12px] !text-secondary-foreground rounded-[4px] px-0.5 !bg-secondary border border-border">
                      ⇧
                    </Kbd>
                    <Kbd className="h-4 text-[12px] !text-secondary-foreground rounded-[4px] px-0.5 !bg-secondary border border-border">
                      P
                    </Kbd>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Embedded face swap mode selector */}
            <CustomSelect
              placeholder="Swap Mode"
              value={nodeConfig?.faceSwapMode || "all-faces"}
              className="border-border bg-accent focus-visible:border-border mt-2 mb-3.5"
              defaultValue="all-faces"
              onValueChange={(value) => {
                updateNodeConfig(id, {
                  ...nodeConfig,
                  faceSwapMode: value as "all-faces" | "individual-faces",
                });
              }}
              items={FACE_SWAP_MODE_OPTIONS}
            />

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
                  Video: { horizontal: "-2.4rem" },
                  "Face Image": { horizontal: "-4.4rem" },
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
  }
);

FaceSwapNodePrototype.displayName = "FaceSwapNodePrototype";

export default FaceSwapNodePrototype;
