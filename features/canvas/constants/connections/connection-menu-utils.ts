import { StaticImageData } from "next/image";
import {
  getAllPreviewSections,
  getNodeFlowConfig,
} from "../nodes/preview-nodes";
import useFlowStore from "../../stores/canvas-store";
import {
  NodeFlowConfig,
  DataType,
  HandleConfig,
} from "../../types/sidebar.types";
import { MyPlanIcon } from "@/constants/icons";

export type ConnectionMenuItem = {
  icon: StaticImageData;
  title: string;
  nodeType: string;
  // For single-upload-node: include target input info to set expectedDataType
  targetInputHandleId?: string;
  targetInputDataType?: DataType;
};

/**
 * Get all available nodes from PREVIEW_NODES for Cmd+K menu
 */
export function getAllAvailableNodes(): ConnectionMenuItem[] {
  const allNodes: ConnectionMenuItem[] = [];

  // Iterate through all sections in PREVIEW_NODES
  const sections = getAllPreviewSections();
  for (const section of sections) {
    for (const node of section.nodes) {
      allNodes.push({
        icon: node.icon,
        title: node.title,
        nodeType: node.nodeType,
      });
    }
  }

  return allNodes;
}

/**
 * Get compatible nodes for upload-node based on asset handle type
 * Returns nodes from PREVIEW_NODES that have inputs compatible with the asset type
 */
export function getCompatibleNodesForUploadNode(
  sourceNodeId: string,
  sourceHandleId: string | null
): ConnectionMenuItem[] {
  const state = useFlowStore.getState();
  const sourceNode = state.nodes.find((n) => n.id === sourceNodeId);

  if (!sourceNode || sourceNode.type !== "upload-node") {
    return [];
  }

  // Get uploadedAssets from source node
  const uploadedAssets = sourceNode.data?.uploadedAssets as
    | Array<{
        id: string;
        type: "image" | "video" | "audio";
      }>
    | undefined;

  if (!uploadedAssets || uploadedAssets.length === 0) {
    return [];
  }

  // If specific handle ID provided, get that asset's type
  let assetType: DataType | null = null;
  if (sourceHandleId) {
    const asset = uploadedAssets.find((a) => a.id === sourceHandleId);
    if (asset) {
      assetType = asset.type;
    }
  } else {
    // If no handle ID, return empty (we need a specific handle to determine type)
    return [];
  }

  // If no asset type found, return empty array
  if (!assetType) {
    return [];
  }

  // Get all nodes from PREVIEW_NODES and check compatibility
  const compatibleNodes: ConnectionMenuItem[] = [];
  const sections = getAllPreviewSections();

  for (const section of sections) {
    for (const node of section.nodes) {
      // Skip if it's the same node type as source
      if (node.nodeType === sourceNode.type) {
        continue;
      }

      // Get target node's flow config
      const targetFlowConfig = getNodeFlowConfig(node.nodeType);

      if (!targetFlowConfig || !targetFlowConfig.inputs) {
        continue;
      }

      // Get all input data types from target node
      const targetInputDataTypes = targetFlowConfig.inputs.map(
        (input: HandleConfig) => input.dataType
      );

      // Check if the asset type matches any target input data type
      const isCompatible = targetInputDataTypes.includes(assetType);

      if (isCompatible) {
        compatibleNodes.push({
          icon: node.icon,
          title: node.title,
          nodeType: node.nodeType,
        });
      }
    }
  }

  return compatibleNodes;
}

/**
 * Get compatible nodes for connection line drag
 * Returns ALL nodes from PREVIEW_NODES that have inputs compatible with the source node's outputs
 */
export function getCompatibleNodes(
  sourceNodeId: string,
  sourceHandleId: string | null
): ConnectionMenuItem[] {
  const state = useFlowStore.getState();
  const sourceNode = state.nodes.find((n) => n.id === sourceNodeId);

  if (!sourceNode) {
    return [];
  }

  // Special handling for upload-node: use uploadedAssets to determine asset type
  if (sourceNode.type === "upload-node") {
    return getCompatibleNodesForUploadNode(sourceNodeId, sourceHandleId);
  }

  // Get source node's flow config
  const sourceFlowConfig = sourceNode.data?.flowConfig as
    | NodeFlowConfig
    | undefined;

  if (!sourceFlowConfig || !sourceFlowConfig.outputs) {
    return [];
  }

  // Get all output data types from source node
  const sourceOutputDataTypes = sourceFlowConfig.outputs.map(
    (output) => output.dataType
  );

  // If no output data types, return empty array
  if (sourceOutputDataTypes.length === 0) {
    return [];
  }

  // Get all nodes from PREVIEW_NODES and check compatibility
  const compatibleNodes: ConnectionMenuItem[] = [];
  const sections = getAllPreviewSections();

  for (const section of sections) {
    for (const node of section.nodes) {
      // Skip if it's the same node type as source
      if (node.nodeType === sourceNode.type) {
        continue;
      }

      // Get target node's flow config
      const targetFlowConfig = getNodeFlowConfig(node.nodeType);

      if (!targetFlowConfig || !targetFlowConfig.inputs) {
        continue;
      }

      // Get all input data types from target node
      const targetInputDataTypes = targetFlowConfig.inputs.map(
        (input: HandleConfig) => input.dataType
      );

      // Check if any source output data type matches any target input data type
      const isCompatible = sourceOutputDataTypes.some((sourceDataType) =>
        targetInputDataTypes.includes(sourceDataType)
      );

      if (isCompatible) {
        compatibleNodes.push({
          icon: node.icon,
          title: node.title,
          nodeType: node.nodeType,
        });
      }
    }
  }

  return compatibleNodes;
}

/**
 * Get compatible source nodes for connection line drag from target handle
 * Returns compatible nodes from PREVIEW_NODES that have outputs compatible with the target node's input
 * Only includes upload nodes and generate nodes (audio, video, image)
 */
export function getCompatibleSourceNodes(
  targetNodeId: string,
  targetHandleId: string | null
): ConnectionMenuItem[] {
  const state = useFlowStore.getState();
  const targetNode = state.nodes.find((n) => n.id === targetNodeId);

  if (!targetNode) {
    return [];
  }

  // Get target node's flow config
  const targetFlowConfig = targetNode.data?.flowConfig as
    | NodeFlowConfig
    | undefined;

  if (!targetFlowConfig || !targetFlowConfig.inputs) {
    return [];
  }

  // Get the target input handle's data type if specified, otherwise get all input data types
  let targetInputDataTypes: DataType[] = [];
  let targetInput: HandleConfig | null = null;

  if (targetHandleId) {
    // Find the specific input handle
    const foundInput = targetFlowConfig.inputs.find(
      (input) => input.id === targetHandleId
    );
    if (foundInput) {
      targetInputDataTypes = [foundInput.dataType];
      targetInput = foundInput;
    }
  } else {
    // Use all input data types from target node
    targetInputDataTypes = targetFlowConfig.inputs.map(
      (input) => input.dataType
    );
  }

  // If no input data types, return empty array
  if (targetInputDataTypes.length === 0) {
    return [];
  }

  // Define allowed node types: upload nodes, generate nodes (audio, video, image), and prompt node
  const allowedNodeTypes = [
    "upload-node",
    "single-upload-node",
    "image-generator-node",
    "video-generator-node",
    "ai-voice-generator-node",
    "text-node",
  ];

  // Asset data types that single-upload-node can handle
  const assetDataTypes: DataType[] = ["image", "video", "audio"];

  // Get all nodes from PREVIEW_NODES and check compatibility
  const compatibleNodes: ConnectionMenuItem[] = [];
  const sections = getAllPreviewSections();

  // Find single-upload-node config
  // Note: single-upload-node is not in PREVIEW_NODES, so we create the config manually
  // using the same icon as upload-node (MyPlanIcon)
  const singleUploadNodeConfig: ConnectionMenuItem = {
    icon: MyPlanIcon,
    title: "Upload Media", // Will be overridden with specific title below
    nodeType: "single-upload-node",
  };

  // Add single-upload-node option if target handle accepts image/video/audio
  if (
    targetInput &&
    targetHandleId &&
    assetDataTypes.includes(targetInput.dataType)
  ) {
    // Helper function to map dataType to specific upload title
    const getUploadTitle = (dataType: DataType): string => {
      switch (dataType) {
        case "image":
          return "Upload Image";
        case "video":
          return "Upload Video";
        case "audio":
          return "Upload Audio";
        default:
          return "Upload Media";
      }
    };

    // Add single-upload-node at the beginning of the list
    compatibleNodes.push({
      ...singleUploadNodeConfig,
      title: getUploadTitle(targetInput.dataType),
      targetInputHandleId: targetInput.id,
      targetInputDataType: targetInput.dataType,
    });
  }

  for (const section of sections) {
    for (const node of section.nodes) {
      // Skip if it's the same node type as target
      if (node.nodeType === targetNode.type) {
        continue;
      }

      // Only include upload nodes, generate nodes, and prompt node
      // Skip single-upload-node as we handle it separately above
      if (
        !allowedNodeTypes.includes(node.nodeType) ||
        node.nodeType === "single-upload-node"
      ) {
        continue;
      }

      // Get source node's flow config
      const sourceFlowConfig = getNodeFlowConfig(node.nodeType);

      if (!sourceFlowConfig || !sourceFlowConfig.outputs) {
        continue;
      }

      // Get all output data types from source node
      const sourceOutputDataTypes = sourceFlowConfig.outputs.map(
        (output: HandleConfig) => output.dataType
      );

      // Check if any target input data type matches any source output data type
      const isCompatible = targetInputDataTypes.some((targetDataType) =>
        sourceOutputDataTypes.includes(targetDataType)
      );

      if (isCompatible) {
        compatibleNodes.push({
          icon: node.icon,
          title: node.title,
          nodeType: node.nodeType,
        });
      }
    }
  }

  return compatibleNodes;
}
