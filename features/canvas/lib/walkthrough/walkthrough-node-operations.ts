import type { Node } from "@xyflow/react";
import { WALKTHROUGH_NODE_TYPES } from "../../constants/walkthrough/walkthrough-node-types";
import {
  DROP_ZONE_LEFT_OFFSET,
  DROP_ZONE_TOP_OFFSET,
} from "./walkthrough-utils";
import { WALKTHROUGH_POSITIONS } from "../../constants/walkthrough/walkthrough-positions";

export const addImageGeneratorNodeAtDropZone = (
  rfInstance: any,
  addNode: (type: string, position: { x: number; y: number }) => string,
  nodes: Node[]
) => {
  if (!rfInstance || !addNode) return;

  const hasImageGeneratorNode = nodes.some(
    (n) => n.type === WALKTHROUGH_NODE_TYPES.IMAGE_GENERATOR
  );

  if (!hasImageGeneratorNode) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const dropZoneCenterX = viewportWidth / 2 + DROP_ZONE_LEFT_OFFSET;
    const dropZoneCenterY = viewportHeight / 2 + DROP_ZONE_TOP_OFFSET;

    const flowPosition = rfInstance.screenToFlowPosition({
      x: dropZoneCenterX,
      y: dropZoneCenterY,
    });

    addNode(WALKTHROUGH_NODE_TYPES.IMAGE_GENERATOR, flowPosition);
  }
};

export const addVideoGeneratorNodeAfterImageGenerator = (
  imageGeneratorNode: Node,
  addNodeAfter: (
    type: string,
    afterId: string,
    offsetX: number,
    offsetY: number
  ) => void
) => {
  if (imageGeneratorNode && addNodeAfter) {
    addNodeAfter(
      WALKTHROUGH_NODE_TYPES.VIDEO_GENERATOR,
      imageGeneratorNode.id,
      WALKTHROUGH_POSITIONS.VIDEO_GENERATOR_OFFSET_X,
      WALKTHROUGH_POSITIONS.VIDEO_GENERATOR_OFFSET_Y
    );
  }
};

