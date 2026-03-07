import { StaticImageData } from "next/image";
import {
  PencilIcon,
  DiagonalIcon,
  ImageToVideoIcon,
  BackgroundIcon,
  AnimationIcon,
  LipSyncIcon,
  MusicIcon,
  AIImageGeneratorIcon,
  TextIcon,
  MyPlanIcon,
} from "@/constants/icons";

export type GhostNodeSuggestion = {
  icon: StaticImageData;
  title: string;
  nodeType: string;
  yOffset: number;
};

type GhostNodesConfig = Record<string, GhostNodeSuggestion[]>;

export const GHOST_NODES_CONFIG: GhostNodesConfig = {
  "text-node": [
    {
      icon: AIImageGeneratorIcon,
      title: "Generate Image",
      nodeType: "image-generator-node",
      yOffset: -300,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 0,
    },
    {
      icon: MusicIcon,
      title: "Generate Voice",
      nodeType: "ai-voice-generator-node",
      yOffset: 300,
    },
  ],
  "image-generator-node": [
    {
      icon: DiagonalIcon,
      title: "Upscale Image",
      nodeType: "ai-image-upscaler-node",
      yOffset: -200,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
    {
      icon: PencilIcon,
      title: "Edit Image",
      nodeType: "ai-image-editor-node",
      yOffset: 600,
    },
  ],
  "ai-image-editor-node": [
    {
      icon: DiagonalIcon,
      title: "Upscale Image",
      nodeType: "ai-image-upscaler-node",
      yOffset: -200,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
    {
      icon: BackgroundIcon,
      title: "Remove Background",
      nodeType: "remove-background-node",
      yOffset: 600,
    },
  ],
  "ai-image-upscaler-node": [
    {
      icon: DiagonalIcon,
      title: "Upscale Image",
      nodeType: "ai-image-upscaler-node",
      yOffset: -200,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
    {
      icon: PencilIcon,
      title: "Edit Image",
      nodeType: "ai-image-editor-node",
      yOffset: 600,
    },
  ],
  "remove-background-node": [
    {
      icon: DiagonalIcon,
      title: "Upscale Image",
      nodeType: "ai-image-upscaler-node",
      yOffset: -200,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
    {
      icon: BackgroundIcon,
      title: "Remove Background",
      nodeType: "remove-background-node",
      yOffset: 600,
    },
  ],
  "face-swap-node": [
    {
      icon: DiagonalIcon,
      title: "Upscale Image",
      nodeType: "ai-image-upscaler-node",
      yOffset: -300,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
  ],
  "video-generator-node": [
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
  ],
  "animation-node": [
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: -200,
    },
  ],
  "face-swap-video-node": [
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: -200,
    },
  ],
  "lip-sync-node": [
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 0,
    },
  ],
  "ai-voice-generator-node": [
    {
      icon: AnimationIcon,
      title: "Create Animation",
      nodeType: "animation-node",
      yOffset: -200,
    },
    {
      icon: LipSyncIcon,
      title: "Sync Lips to Audio",
      nodeType: "lip-sync-node",
      yOffset: 200,
    },
  ],
  "single-upload-node": [
    {
      icon: PencilIcon,
      title: "Edit Image",
      nodeType: "ai-image-editor-node",
      yOffset: -200,
    },
    {
      icon: DiagonalIcon,
      title: "Upscale Image",
      nodeType: "ai-image-upscaler-node",
      yOffset: 0,
    },
    {
      icon: BackgroundIcon,
      title: "Remove Background",
      nodeType: "remove-background-node",
      yOffset: 200,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 400,
    },
  ],

  // Prototype nodes
  "image-generator-node-prototype": [
    {
      icon: DiagonalIcon,
      title: "Upscale Image",
      nodeType: "ai-image-upscaler-node",
      yOffset: -200,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
    {
      icon: PencilIcon,
      title: "Edit Image",
      nodeType: "ai-image-editor-node",
      yOffset: 600,
    },
  ],
  "ai-image-editor-node-prototype": [
    {
      icon: DiagonalIcon,
      title: "Upscale Image",
      nodeType: "ai-image-upscaler-node",
      yOffset: -200,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
    {
      icon: BackgroundIcon,
      title: "Remove Background",
      nodeType: "remove-background-node",
      yOffset: 600,
    },
  ],
  "ai-image-upscaler-node-prototype": [
    {
      icon: DiagonalIcon,
      title: "Upscale Image",
      nodeType: "ai-image-upscaler-node",
      yOffset: -200,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
    {
      icon: PencilIcon,
      title: "Edit Image",
      nodeType: "ai-image-editor-node",
      yOffset: 600,
    },
  ],
  "face-swap-node-prototype": [
    {
      icon: DiagonalIcon,
      title: "Upscale Image",
      nodeType: "ai-image-upscaler-node",
      yOffset: -300,
    },
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
  ],
  "ai-voice-generator-node-prototype": [
    {
      icon: AnimationIcon,
      title: "Create Animation",
      nodeType: "animation-node",
      yOffset: -200,
    },
    {
      icon: LipSyncIcon,
      title: "Sync Lips to Audio",
      nodeType: "lip-sync-node-prototype",
      yOffset: 200,
    },
  ],
  "video-generator-node-prototype": [
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node",
      yOffset: 300,
    },
  ],
  "lip-sync-node-prototype": [
    {
      icon: ImageToVideoIcon,
      title: "Generate Video",
      nodeType: "video-generator-node-prototype",
      yOffset: 0,
    },
  ],
};

type InputGhostNodesConfig = Record<string, GhostNodeSuggestion[]>;

export const INPUT_GHOST_NODES_CONFIG: InputGhostNodesConfig = {
  "image-generator-node": [
    {
      icon: TextIcon,
      title: "Add Prompt",
      nodeType: "text-node",
      yOffset: 0,
    },
  ],
  "ai-image-editor-node": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: -200,
    },
    {
      icon: TextIcon,
      title: "Add Prompt",
      nodeType: "text-node",
      yOffset: 0,
    },
  ],
  "ai-image-upscaler-node": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: 0,
    },
  ],
  "remove-background-node": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: 0,
    },
  ],
  "face-swap-node": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: -200,
    },
  ],
  "face-swap-video-node": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: -200,
    },
  ],
  "lip-sync-node": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: -200,
    },
  ],
  "ai-voice-generator-node": [
    {
      icon: TextIcon,
      title: "Add Prompt",
      nodeType: "text-node",
      yOffset: 0,
    },
  ],
  "video-generator-node": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: -200,
    },
  ],
  "animation-node": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: -200,
    },
    {
      icon: MusicIcon,
      title: "Generate Voice",
      nodeType: "ai-voice-generator-node",
      yOffset: 200,
    },
  ],

  // Prototype nodes
  "image-generator-node-prototype": [],
  "ai-image-editor-node-prototype": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: -200,
    },
  ],
  "ai-image-upscaler-node-prototype": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: 0,
    },
  ],
  "face-swap-node-prototype": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: -200,
    },
  ],
  "ai-voice-generator-node-prototype": [],
  "video-generator-node-prototype": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: -200,
    },
  ],
  "lip-sync-node-prototype": [
    {
      icon: MyPlanIcon,
      title: "Upload Media",
      nodeType: "single-upload-node",
      yOffset: -200,
    },
  ],
};

export const getGhostNodes = (
  nodeType: string,
  sourceFlowConfig?: any,
  sourceNode?: any
): GhostNodeSuggestion[] => {
  const suggestions = GHOST_NODES_CONFIG[nodeType] || [];

  // If no source flow config provided, return all suggestions
  if (!sourceFlowConfig) {
    return suggestions;
  }

  // Dynamically import PREVIEW_NODES to get target node configs
  // This validates suggestions against their actual input handles
  const { getNodeFlowConfig } = require("./preview-nodes");

  // Special handling for single-upload-node: check actual dataType from node data
  if (nodeType === "single-upload-node" && sourceNode) {
    const assetType = sourceNode.data?.assetType as
      | "image"
      | "video"
      | "audio"
      | null
      | undefined;
    const expectedDataType = sourceNode.data?.expectedDataType as
      | "image"
      | "video"
      | "audio"
      | "string"
      | null
      | undefined;

    const sourceDataType =
      assetType ||
      (expectedDataType && expectedDataType !== "string"
        ? expectedDataType
        : "string");

    // Filter suggestions to only include nodes that have compatible inputs
    return suggestions.filter((suggestion) => {
      const targetFlowConfig = getNodeFlowConfig(suggestion.nodeType);

      if (!targetFlowConfig || !targetFlowConfig.inputs) {
        return false;
      }

      // Check if any input of target node matches the source dataType
      const targetInputs = targetFlowConfig.inputs || [];

      return targetInputs.some(
        (input: any) => input.dataType === sourceDataType
      );
    });
  }

  // Filter suggestions to only include nodes that have compatible inputs
  return suggestions.filter((suggestion) => {
    const targetFlowConfig = getNodeFlowConfig(suggestion.nodeType);

    if (!targetFlowConfig || !targetFlowConfig.inputs) {
      return false;
    }

    // Check if any output of source node matches any input of target node
    const sourceOutputs = sourceFlowConfig.outputs || [];
    const targetInputs = targetFlowConfig.inputs || [];

    return sourceOutputs.some((output: any) =>
      targetInputs.some((input: any) => input.dataType === output.dataType)
    );
  });
};

export const getInputGhostNodes = (
  nodeType: string,
  targetFlowConfig?: any,
  targetNodeId?: string,
  edges?: any[],
  nodes?: any[]
): GhostNodeSuggestion[] => {
  const suggestions = INPUT_GHOST_NODES_CONFIG[nodeType] || [];

  // If no target flow config provided, return all suggestions
  if (!targetFlowConfig) {
    return suggestions;
  }

  // Get all inputs (both required and optional)
  const allInputs = targetFlowConfig.inputs || [];

  // Get unconnected inputs
  const unconnectedInputs =
    edges && targetNodeId
      ? allInputs.filter((input: any) => {
          return !edges.some(
            (edge: any) =>
              edge.target === targetNodeId && edge.targetHandle === input.id
          );
        })
      : allInputs;

  if (unconnectedInputs.length === 0) {
    return [];
  }

  // Separate asset inputs (image/video/audio) from non-asset inputs (string)
  const assetDataTypes = ["image", "video", "audio"];
  const unconnectedAssetInputs = unconnectedInputs.filter((input: any) =>
    assetDataTypes.includes(input.dataType)
  );

  // Dynamically import PREVIEW_NODES to get source node configs
  const { getNodeFlowConfig } = require("./preview-nodes");

  // Build result array
  const result: GhostNodeSuggestion[] = [];

  // Find single-upload-node suggestion template
  const singleUploadSuggestionTemplate = suggestions.find(
    (s) => s.nodeType === "single-upload-node"
  );

  // For single-upload-node: create one suggestion per unconnected asset input
  if (singleUploadSuggestionTemplate && unconnectedAssetInputs.length > 0) {
    // Sort asset inputs by their actual order in the target node's inputs
    // This ensures suggestions appear in the same order as the handles (top to bottom)
    const sortedAssetInputs = [...unconnectedAssetInputs].sort((a, b) => {
      const aIndex =
        targetFlowConfig.inputs?.findIndex((inp: any) => inp.id === a.id) ?? 0;
      const bIndex =
        targetFlowConfig.inputs?.findIndex((inp: any) => inp.id === b.id) ?? 0;
      return aIndex - bIndex;
    });

    // Create one suggestion per unconnected asset input
    // Each will be matched to its corresponding input by position
    sortedAssetInputs.forEach((input, index) => {
      result.push({
        ...singleUploadSuggestionTemplate,
        // Keep original title - matching will be done by position in hook
      });
    });
  }

  // Filter other suggestions and check if outputs match unconnected inputs
  const otherSuggestions = suggestions.filter(
    (s) => s.nodeType !== "single-upload-node"
  );

  // Track seen node types to avoid duplicates (except single-upload-node which we handle above)
  const seenNodeTypes = new Set<string>();

  for (const suggestion of otherSuggestions) {
    // Skip if we've already seen this node type
    if (seenNodeTypes.has(suggestion.nodeType)) {
      continue;
    }

    // Check if outputs match unconnected inputs
    const sourceFlowConfig = getNodeFlowConfig(suggestion.nodeType);

    if (!sourceFlowConfig || !sourceFlowConfig.outputs) {
      continue;
    }

    // Check if any output of source node matches any unconnected input of target node
    const sourceOutputs = sourceFlowConfig.outputs || [];
    const hasMatch = unconnectedInputs.some((input: any) =>
      sourceOutputs.some((output: any) => output.dataType === input.dataType)
    );

    // If it matches, add to result and mark as seen
    if (hasMatch) {
      result.push(suggestion);
      seenNodeTypes.add(suggestion.nodeType);
    }
  }

  return result;
};
