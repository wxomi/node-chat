import type { Node } from "@xyflow/react";
import { WALKTHROUGH_NODE_TYPES } from "../../constants/walkthrough/walkthrough-node-types";

export const cleanupWalkthroughNodes = (
  nodes: Node[],
  deleteNode: (id: string) => void,
  updateNodeData: (id: string, data: any) => void
) => {
  // Remove all purple circle nodes
  const purpleCircleNodes = nodes.filter(
    (n) => n.type === WALKTHROUGH_NODE_TYPES.PURPLE_CIRCLE
  );
  purpleCircleNodes.forEach((node) => {
    deleteNode(node.id);
  });

  // Remove isWalkthroughNode flag from text nodes (keep the nodes)
  const walkthroughTextNodes = nodes.filter(
    (n) =>
      n.type === WALKTHROUGH_NODE_TYPES.TEXT_NODE &&
      n.data?.isWalkthroughNode === true
  );
  walkthroughTextNodes.forEach((node) => {
    updateNodeData(node.id, { isWalkthroughNode: undefined });
  });
};
