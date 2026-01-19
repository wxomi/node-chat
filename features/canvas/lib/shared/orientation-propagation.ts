import type { Edge } from "@xyflow/react";
import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import type { NodeFlowConfig } from "../../types/sidebar.types";
import {
  calculateOrientationFromDimensions,
  type Dimensions,
} from "../../lib/upload";

type Orientation = "square" | "landscape" | "portrait";

/**
 * Gets the orientation from a connected source node
 */
export function getOrientationFromSource(
  nodeId: string,
  handleId: string,
  edges: Edge[],
  nodeConfigs: Record<string, any>
): Orientation | null {
  // Find edge connecting to this handle
  const edge = edges.find(
    (e) => e.target === nodeId && e.targetHandle === handleId
  );

  if (!edge) return null;

  const sourceNode = useFlowStore
    .getState()
    .nodes.find((n) => n.id === edge.source);

  if (!sourceNode) return null;

  // Check if source node is upload-node and has uploadedAssets with dimensions
  if (sourceNode.type === "upload-node" && sourceNode.data?.uploadedAssets) {
    const uploadedAssets = sourceNode.data.uploadedAssets as Array<{
      id: string;
      type: "image" | "video" | "audio";
      fileName: string;
      previewUrl: string;
      filePath: string;
      isUploading?: boolean;
      width?: number;
      height?: number;
    }>;

    // Find asset matching sourceHandle
    const asset = uploadedAssets.find(
      (a) => a.id === edge.sourceHandle && a.type === "image"
    );

    // If asset has dimensions, calculate orientation from them
    if (asset && asset.width && asset.height) {
      return calculateOrientationFromDimensions(asset.width, asset.height);
    }
  }

  // Check if source node is single-upload-node and has imageDimensions
  if (
    sourceNode.type === "single-upload-node" &&
    sourceNode.data?.imageDimensions
  ) {
    const imageDimensions = sourceNode.data.imageDimensions as {
      width: number;
      height: number;
    };

    // Check if this is an image asset (single-upload-node only has one asset)
    if (
      sourceNode.data?.assetType === "image" &&
      imageDimensions.width &&
      imageDimensions.height
    ) {
      return calculateOrientationFromDimensions(
        imageDimensions.width,
        imageDimensions.height
      );
    }
  }

  // Fall back to reading from node config
  const sourceConfig = nodeConfigs[edge.source];
  return sourceConfig?.orientation || null;
}

/**
 * Gets dimensions from a connected source upload node
 * @param nodeId - Target node ID
 * @param handleId - Target handle ID (e.g., "image-input")
 * @param edges - Array of edges
 * @returns Dimensions object with width and height, or null if not found
 */
export function getDimensionsFromSource(
  nodeId: string,
  handleId: string,
  edges: Edge[]
): Dimensions | null {
  // Find edge connecting to this handle
  const edge = edges.find(
    (e) => e.target === nodeId && e.targetHandle === handleId
  );

  if (!edge) return null;

  const sourceNode = useFlowStore
    .getState()
    .nodes.find((n) => n.id === edge.source);

  if (!sourceNode) return null;

  // Check if source node is upload-node with uploadedAssets
  if (sourceNode.type === "upload-node" && sourceNode.data?.uploadedAssets) {
    const uploadedAssets = sourceNode.data.uploadedAssets as Array<{
      id: string;
      type: "image" | "video" | "audio";
      fileName: string;
      previewUrl: string;
      filePath: string;
      isUploading?: boolean;
      width?: number;
      height?: number;
    }>;

    // Find asset matching sourceHandle - support both image and video
    const asset = uploadedAssets.find(
      (a) =>
        a.id === edge.sourceHandle && (a.type === "image" || a.type === "video")
    );

    if (asset && asset.width && asset.height) {
      return {
        width: asset.width,
        height: asset.height,
      };
    }
  }

  // Check if source node is single-upload-node with imageDimensions (supports both image and video)
  if (
    sourceNode.type === "single-upload-node" &&
    sourceNode.data?.imageDimensions &&
    (sourceNode.data?.assetType === "image" ||
      sourceNode.data?.assetType === "video")
  ) {
    const imageDimensions = sourceNode.data.imageDimensions as Dimensions;
    if (imageDimensions.width && imageDimensions.height) {
      return imageDimensions;
    }
  }

  return null;
}

/**
 * Propagates orientation from a source node to all downstream nodes
 */
export function propagateOrientationDownstream(
  sourceNodeId: string,
  newOrientation: Orientation
) {
  const { nodes, edges } = useFlowStore.getState();
  const { nodeConfigs, updateNodeConfig } = useConfigStore.getState();

  // Find all nodes connected to this node's image outputs
  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  if (!sourceNode) return;

  const flowConfig = sourceNode.data?.flowConfig as NodeFlowConfig | undefined;
  if (!flowConfig?.outputs) return;

  // Find image outputs
  const imageOutputs = flowConfig.outputs.filter(
    (output) => output.dataType === "image"
  );

  // For each image output, find connected downstream nodes
  imageOutputs.forEach((output) => {
    const connectedEdges = edges.filter(
      (edge) => edge.source === sourceNodeId && edge.sourceHandle === output.id
    );

    connectedEdges.forEach((edge) => {
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!targetNode) return;

      const targetNodeType = targetNode.type;

      // Check if target node supports orientation (for now, only ai-image-editor-node)
      const supportsOrientation = targetNodeType === "ai-image-editor-node";

      if (supportsOrientation) {
        const targetNodeData = targetNode.data;
        const hasGeneratedImage = !!targetNodeData?.imageDetails;

        // Only update if no image has been generated yet
        if (!hasGeneratedImage) {
          updateNodeConfig(edge.target, {
            ...nodeConfigs[edge.target],
            orientation: newOrientation,
          });
        }

        // Recursively propagate to further downstream nodes
        propagateOrientationDownstream(edge.target, newOrientation);
      }
    });
  });
}

/**
 * Updates orientation from source after generation completes
 */
export function updateOrientationAfterGeneration(nodeId: string) {
  const { nodes, edges } = useFlowStore.getState();
  const { nodeConfigs, updateNodeConfig } = useConfigStore.getState();

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return;

  const flowConfig = node.data?.flowConfig as NodeFlowConfig | undefined;
  if (!flowConfig?.inputs) return;

  // Find image input
  const imageInput = flowConfig.inputs.find(
    (input) => input.dataType === "image"
  );

  if (!imageInput) return;

  // Find connected edge
  const edge = edges.find(
    (e) => e.target === nodeId && e.targetHandle === imageInput.id
  );

  if (!edge) return;

  // Get source orientation
  const sourceConfig = nodeConfigs[edge.source];
  const sourceOrientation = sourceConfig?.orientation;

  if (!sourceOrientation) return;

  // Update node config if different
  const currentOrientation = nodeConfigs[nodeId]?.orientation;
  if (currentOrientation !== sourceOrientation) {
    updateNodeConfig(nodeId, {
      ...nodeConfigs[nodeId],
      orientation: sourceOrientation,
    });

    // Propagate to downstream nodes
    propagateOrientationDownstream(nodeId, sourceOrientation);
  }
}
