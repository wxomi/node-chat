import type { PurpleCircleConfig } from "../../constants/walkthrough/walkthrough-purple-circles";
import useFlowStore from "../../stores/canvas-store";
import { Node, Edge, Connection } from "@xyflow/react";
import { isValidConnection } from "../canvas/canvas-utils";

// Circle overlay constants
export const OVERLAY_RADIUS = 88; // size-44 = 176px / 2
export const OVERLAY_TOP_PERCENT = 0.45; // Match top-[45%] positioning

/**
 * Calculates the overlay center position in screen coordinates.
 * The overlay is positioned at top-[45%] and left-1/2 (center horizontally).
 *
 * @returns Object with x and y coordinates of the overlay center
 */
export const getOverlayCenter = () => {
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight * OVERLAY_TOP_PERCENT,
  };
};

/**
 * Calculates the distance between two points.
 *
 * @param point1 - First point with x and y coordinates
 * @param point2 - Second point with x and y coordinates
 * @returns Euclidean distance between the points
 */
export const calculateDistance = (
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number => {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
};

/**
 * Calculates the maximum distance from a node's center to any of its corners.
 * Used for collision detection to ensure the entire node is inside the overlay.
 *
 * @param width - Node width in pixels
 * @param height - Node height in pixels
 * @returns Maximum distance from center to corner
 */
export const calculateMaxCornerDistance = (
  width: number,
  height: number
): number => {
  return Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
};

/**
 * Checks if a node is completely covered by a circular overlay.
 * A node is considered covered if all its corners are inside the overlay circle.
 *
 * @param nodeCenterScreenPos - Node center position in screen coordinates
 * @param nodeWidth - Node width in pixels
 * @param nodeHeight - Node height in pixels
 * @param overlayCenter - Overlay center position in screen coordinates
 * @param overlayRadius - Overlay radius in pixels
 * @returns true if the entire node is inside the overlay, false otherwise
 */
export const isNodeCoveredByOverlay = (
  nodeCenterScreenPos: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number,
  overlayCenter: { x: number; y: number },
  overlayRadius: number
): boolean => {
  const distance = calculateDistance(nodeCenterScreenPos, overlayCenter);
  const maxCornerDistance = calculateMaxCornerDistance(nodeWidth, nodeHeight);

  // Check if entire node (including all corners) is completely inside overlay
  // The furthest point of the node from overlay center is at distance + maxCornerDistance
  return distance + maxCornerDistance <= overlayRadius;
};

/**
 * Calculates responsive positions for purple circles based on viewport size.
 * Positions are calculated as percentages to maintain layout across different screen sizes.
 *
 * @param viewportWidth - The width of the viewport in pixels
 * @param viewportHeight - The height of the viewport in pixels
 * @returns Array of purple circle configurations with calculated positions
 */
export const getPurpleCirclePositions = (
  viewportWidth: number,
  viewportHeight: number
): PurpleCircleConfig[] => {
  // Define positions as percentages (0-1) of viewport
  // These maintain the rectangle layout but scale with screen size
  const topLeftPercent = { x: 0.15, y: 0.2 }; // ~15% from left, 20% from top
  const topRightPercent = { x: 0.75, y: 0.2 }; // ~75% from left, 20% from top
  const bottomLeftPercent = { x: 0.15, y: 0.5 }; // ~15% from left, 50% from top
  const bottomRightPercent = { x: 0.75, y: 0.5 }; // ~75% from left, 50% from top

  return [
    {
      id: "walkthrough-circle-1",
      position: {
        x: viewportWidth * topLeftPercent.x,
        y: viewportHeight * topLeftPercent.y,
      },
      number: 1,
    },
    {
      id: "walkthrough-circle-2",
      position: {
        x: viewportWidth * topRightPercent.x,
        y: viewportHeight * topRightPercent.y,
      },
      number: 2,
    },
    {
      id: "walkthrough-circle-3",
      position: {
        x: viewportWidth * bottomLeftPercent.x,
        y: viewportHeight * bottomLeftPercent.y,
      },
      number: 3,
    },
    {
      id: "walkthrough-circle-4",
      position: {
        x: viewportWidth * bottomRightPercent.x,
        y: viewportHeight * bottomRightPercent.y,
      },
      number: 4,
    },
  ];
};

/**
 * Calculates the intersection area between two rectangles.
 *
 * @param rect1 - First rectangle with x, y, width, height
 * @param rect2 - Second rectangle with x, y, width, height
 * @returns Intersection area in square pixels, or 0 if no intersection
 */
export const calculateRectangleOverlap = (
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): number => {
  // Calculate the intersection rectangle
  const left = Math.max(rect1.x, rect2.x);
  const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width);
  const top = Math.max(rect1.y, rect2.y);
  const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height);

  // If there's no intersection, return 0
  if (left >= right || top >= bottom) {
    return 0;
  }

  // Calculate intersection area
  const width = right - left;
  const height = bottom - top;
  return width * height;
};

/**
 * Rectangle overlay position constants
 */
export const RECTANGLE_OVERLAY_WIDTH = 600; // px
export const RECTANGLE_OVERLAY_HEIGHT = 350; // px
export const RECTANGLE_OVERLAY_LEFT_PERCENT = 2 / 3; // left-2/3
export const RECTANGLE_OVERLAY_TOP_PERCENT = 0.45; // top-[45%]
export const RECTANGLE_OVERLAY_COVERAGE_THRESHOLD = 0.5; // 50%

/**
 * Gets the rectangle overlay position in screen coordinates.
 * The overlay is positioned at top-[45%] and left-2/3, then centered.
 *
 * @returns Object with x and y coordinates of the overlay top-left corner
 */
export const getRectangleOverlayScreenPosition = (): {
  x: number;
  y: number;
} => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Overlay center position
  const centerX = viewportWidth * RECTANGLE_OVERLAY_LEFT_PERCENT;
  const centerY = viewportHeight * RECTANGLE_OVERLAY_TOP_PERCENT;

  // Top-left corner position
  return {
    x: centerX - RECTANGLE_OVERLAY_WIDTH / 2,
    y: centerY - RECTANGLE_OVERLAY_HEIGHT / 2,
  };
};

/**
 * Calculates what percentage of the node area is covered by the overlay.
 * Returns intersection area / node area as a decimal (0.0 to 1.0).
 *
 * @param nodeScreenPos - Node top-left position in screen coordinates
 * @param nodeWidth - Node width in pixels
 * @param nodeHeight - Node height in pixels
 * @param overlayScreenPos - Overlay top-left position in screen coordinates
 * @param overlayWidth - Overlay width in pixels
 * @param overlayHeight - Overlay height in pixels
 * @returns Percentage as decimal (e.g., 0.5 for 50%)
 */
export const getNodeCoverageByOverlay = (
  nodeScreenPos: { x: number; y: number },
  nodeWidth: number,
  nodeHeight: number,
  overlayScreenPos: { x: number; y: number },
  overlayWidth: number,
  overlayHeight: number
): number => {
  const nodeArea = nodeWidth * nodeHeight;
  if (nodeArea === 0) return 0;

  const intersectionArea = calculateRectangleOverlap(
    {
      x: nodeScreenPos.x,
      y: nodeScreenPos.y,
      width: nodeWidth,
      height: nodeHeight,
    },
    {
      x: overlayScreenPos.x,
      y: overlayScreenPos.y,
      width: overlayWidth,
      height: overlayHeight,
    }
  );

  // Return intersection area / node area (what percentage of node is covered by overlay)
  return intersectionArea / nodeArea;
};

/**
 * Checks if at least 50% of the walkthrough prompt node is covered by the rectangle overlay.
 * This function detects zoom in/out via scroll wheel - as you zoom, the node size changes.
 *
 * @param rfInstance - ReactFlow instance to convert coordinates
 * @returns true if >= 50% of the node is covered by the overlay, false otherwise
 */
export const checkPromptNodeInRectangleOverlay = (rfInstance: any): boolean => {
  if (!rfInstance) return false;

  const nodes = useFlowStore.getState().nodes;
  const promptNode = nodes.find(
    (n) => n.type === "text-node" && n.data?.isWalkthroughNode === true
  );

  if (!promptNode) {
    return false;
  }

  // Get viewport zoom level
  const viewport = rfInstance.getViewport();
  const zoom = viewport.zoom;

  // Convert node position from flow to screen coordinates
  const nodeScreenPos = rfInstance.flowToScreenPosition(promptNode.position);
  
  // Node dimensions in flow coordinates - need to multiply by zoom for screen size
  const nodeFlowWidth = promptNode.width || 200;
  const nodeFlowHeight = promptNode.height || 150;
  const nodeWidth = nodeFlowWidth * zoom;
  const nodeHeight = nodeFlowHeight * zoom;

  // Get overlay position
  const overlayScreenPos = getRectangleOverlayScreenPosition();

  // Calculate what percentage of node is covered by overlay
  const coverage = getNodeCoverageByOverlay(
    nodeScreenPos,
    nodeWidth,
    nodeHeight,
    overlayScreenPos,
    RECTANGLE_OVERLAY_WIDTH,
    RECTANGLE_OVERLAY_HEIGHT
  );

  return coverage >= RECTANGLE_OVERLAY_COVERAGE_THRESHOLD;
};

/**
 * Drop zone overlay position constants
 */
export const DROP_ZONE_WIDTH = 400; // px
export const DROP_ZONE_HEIGHT = 500; // px
export const DROP_ZONE_LEFT_OFFSET = 200; // px offset from center
export const DROP_ZONE_TOP_OFFSET = -300; // px offset from center

/**
 * Gets the drop zone position in screen coordinates.
 * The drop zone is positioned at center with offsets.
 *
 * @returns Object with x and y coordinates of the drop zone top-left corner
 */
export const getDropZoneScreenPosition = (): {
  x: number;
  y: number;
} => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Drop zone center position (50% + offset)
  const centerX = viewportWidth / 2 + DROP_ZONE_LEFT_OFFSET;
  const centerY = viewportHeight / 2 + DROP_ZONE_TOP_OFFSET;

  // Top-left corner position
  return {
    x: centerX - DROP_ZONE_WIDTH / 2,
    y: centerY - DROP_ZONE_HEIGHT / 2,
  };
};

/**
 * Checks if an image generator node is positioned within the drop zone overlay.
 * This function detects when a node is dropped in the drop zone area.
 *
 * @param rfInstance - ReactFlow instance to convert coordinates
 * @returns true if the image generator node is within the drop zone, false otherwise
 */
export const checkImageGeneratorNodeInDropZone = (rfInstance: any): boolean => {
  if (!rfInstance) return false;

  const nodes = useFlowStore.getState().nodes;
  const imageGeneratorNode = nodes.find(
    (n) => n.type === "image-generator-node"
  );

  if (!imageGeneratorNode) {
    return false;
  }

  // Get viewport zoom level
  const viewport = rfInstance.getViewport();
  const zoom = viewport.zoom;

  // Convert node position from flow to screen coordinates
  const nodeScreenPos = rfInstance.flowToScreenPosition(
    imageGeneratorNode.position
  );

  // Node dimensions in flow coordinates - need to multiply by zoom for screen size
  const nodeFlowWidth = imageGeneratorNode.width || 200;
  const nodeFlowHeight = imageGeneratorNode.height || 150;
  const nodeWidth = nodeFlowWidth * zoom;
  const nodeHeight = nodeFlowHeight * zoom;

  // Get drop zone position
  const dropZoneScreenPos = getDropZoneScreenPosition();

  // Calculate what percentage of node is covered by drop zone
  const coverage = getNodeCoverageByOverlay(
    nodeScreenPos,
    nodeWidth,
    nodeHeight,
    dropZoneScreenPos,
    DROP_ZONE_WIDTH,
    DROP_ZONE_HEIGHT
  );

  // Consider it successful if at least 50% of the node is in the drop zone
  return coverage >= 0.5;
};

/**
 * Detects when an image generator node is dropped anywhere on the canvas.
 * Note: Success detection is handled by the drop-zone component.
 *
 * @param rfInstance - ReactFlow instance
 */
export const detectImageGeneratorNodeDrop = (rfInstance: any): void => {
  if (!rfInstance) return;

  const nodes = useFlowStore.getState().nodes;
  const imageGeneratorNode = nodes.find(
    (n) => n.type === "image-generator-node"
  );

  // Node dropped successfully - detection handled by drop-zone component
};

/**
 * Determines whether fitView should be disabled based on walkthrough state.
 * Disables fitView when walkthrough steps are active (prevents unwanted zoom)
 * and also disables it if step 8 is completed to preserve camera position.
 *
 * @param isWalkthroughActive - Whether the walkthrough is currently active
 * @param currentStep - The current walkthrough step number
 * @param nodes - Array of all nodes in the canvas
 * @param isStep8Completed - Whether step 8 has been completed
 * @returns true if fitView should be disabled, false otherwise
 */
export const shouldDisableFitView = (
  isWalkthroughActive: boolean,
  currentStep: number,
  nodes: Node[],
  isStep8Completed: boolean
): boolean => {
  // If step 8 is completed, keep fitView disabled to preserve camera position
  if (isStep8Completed) return true;

  if (!isWalkthroughActive) return false;

  switch (currentStep) {
    case 1:
      return nodes.some((n) => n.type === "walkthrough-purple-circle");
    case 2:
      return nodes.some(
        (n) => n.type === "text-node" && n.data?.isWalkthroughNode === true
      );
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
      return true;
    default:
      return false;
  }
};

/**
 * Validates connections during walkthrough step 5.
 * During step 5, only allows connections from the walkthrough prompt node output
 * to the image generator node input. All other connections are blocked.
 *
 * @param connection - The connection being validated (can be Connection or Edge)
 * @param nodes - Array of all nodes in the canvas
 * @param edges - Array of all edges in the canvas
 * @param isStep5Active - Whether walkthrough step 5 is currently active
 * @returns true if the connection is valid, false otherwise
 */
export const validateWalkthroughStep5Connection = (
  connection: Connection | Edge,
  nodes: Node[],
  edges: Edge[],
  isStep5Active: boolean
): boolean => {
  const conn: Connection = {
    source: connection.source,
    target: connection.target,
    sourceHandle: (connection.sourceHandle ?? null) as string | null,
    targetHandle: (connection.targetHandle ?? null) as string | null,
  };

  // If step 5 is not active, use standard validation
  if (!isStep5Active) {
    return isValidConnection(conn, nodes, edges);
  }

  // Find walkthrough prompt node and image generator node
  const promptNode = nodes.find(
    (n) => n.type === "text-node" && n.data?.isWalkthroughNode === true
  );
  const imageGeneratorNode = nodes.find(
    (n) => n.type === "image-generator-node"
  );

  // Only allow connection from prompt node output to image generator input
  if (promptNode && imageGeneratorNode) {
    const isFromPromptNode = conn.source === promptNode.id;
    const isToImageGenerator = conn.target === imageGeneratorNode.id;

    // Get flow configs to check handle data types
    const promptFlowConfig = promptNode.data?.flowConfig as any;
    const imageFlowConfig = imageGeneratorNode.data?.flowConfig as any;

    // Check if source handle is from prompt node outputs
    const isValidSourceHandle = promptFlowConfig?.outputs?.some(
      (output: any) => output.id === conn.sourceHandle
    );

    // Check if target handle accepts "string" (Prompt) data type
    const isValidTargetHandle = imageFlowConfig?.inputs?.some(
      (input: any) =>
        input.id === conn.targetHandle && input.dataType === "string"
    );

    // Only allow if connecting prompt output to image generator input
    if (
      isFromPromptNode &&
      isToImageGenerator &&
      isValidSourceHandle &&
      isValidTargetHandle
    ) {
      return isValidConnection(conn, nodes, edges);
    }

    // Block all other connections during step 5
    return false;
  }

  // If nodes don't exist yet, block all connections
  return false;
};
