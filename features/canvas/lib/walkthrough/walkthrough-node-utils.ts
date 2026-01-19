import type { Node } from "@xyflow/react";
import { WALKTHROUGH_NODE_TYPES } from "../../constants/walkthrough/walkthrough-node-types";

export const findImageGeneratorNode = (nodes: Node[]) =>
  nodes.find((n) => n.type === WALKTHROUGH_NODE_TYPES.IMAGE_GENERATOR);

export const findWalkthroughPromptNode = (nodes: Node[]) =>
  nodes.find(
    (n) =>
      n.type === WALKTHROUGH_NODE_TYPES.TEXT_NODE &&
      n.data?.isWalkthroughNode === true
  );

export const findPurpleCircleNodes = (nodes: Node[]) =>
  nodes.filter((n) => n.type === WALKTHROUGH_NODE_TYPES.PURPLE_CIRCLE);

export const findWalkthroughTextNodes = (nodes: Node[]) =>
  nodes.filter(
    (n) =>
      n.type === WALKTHROUGH_NODE_TYPES.TEXT_NODE &&
      n.data?.isWalkthroughNode === true
  );

export const isImageGeneratorGenerating = (
  imageGeneratorNode: Node | undefined,
  isStep6Active: boolean
): boolean => {
  if (!isStep6Active || !imageGeneratorNode) return false;

  const generatedImageId = imageGeneratorNode.data?.generatedImageId;
  const imageDetails = imageGeneratorNode.data?.imageDetails;

  return !!(generatedImageId && !imageDetails);
};

