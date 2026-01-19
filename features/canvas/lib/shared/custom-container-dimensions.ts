import type { Dimensions } from "../upload/dimension-extraction";

type ContainerOverhead = {
  total: number;
};

/**
 * Calculates custom container dimensions based on source aspect ratio
 * Maintains aspect ratio while respecting min/max constraints
 * @param sourceDimensions - Source dimensions from upload node or other connected node
 * @param containerOverhead - Container overhead object with total property
 * @param hasGeneratedOrientation - Whether generation has started (orientation was set from source)
 * @returns Custom container dimensions or null if conditions not met
 */
export function calculateCustomContainerDimensions(
  sourceDimensions: Dimensions | null,
  containerOverhead: ContainerOverhead,
  hasGeneratedOrientation: boolean
): Dimensions | null {
  // Only use custom dimensions if generation has started (orientation was set from source)
  if (!sourceDimensions || !hasGeneratedOrientation) return null;

  const aspectRatio = sourceDimensions.width / sourceDimensions.height;

  // Calculate preview dimensions maintaining aspect ratio
  // Use a base width and calculate height, or vice versa
  // Max width: 683px (landscape), Max height: 512px (portrait)
  let previewWidth: number;
  let previewHeight: number;

  if (aspectRatio >= 1) {
    // Landscape or square
    previewWidth = Math.min(683, sourceDimensions.width);
    previewHeight = previewWidth / aspectRatio;
  } else {
    // Portrait
    previewHeight = Math.min(512, sourceDimensions.height);
    previewWidth = previewHeight * aspectRatio;
  }

  // Ensure minimum sizes
  previewWidth = Math.max(288, previewWidth);
  previewHeight = Math.max(288, previewHeight);

  return {
    width: previewWidth,
    height: previewHeight + containerOverhead.total,
  };
}
