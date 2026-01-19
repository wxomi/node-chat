/**
 * Video preview dimensions utility
 * Provides dimension maps for video nodes based on orientation
 * Dimensions match exact aspect ratios of generated videos to prevent cropping
 * Square: 1:1, Landscape: 16:9 (1.7778:1), Portrait: 9:16 (0.5625:1)
 */

type Orientation = "square" | "landscape" | "portrait";

type Dimensions = {
  width: number;
  height: number;
};

type PreviewDimensionsMap = {
  square: Dimensions;
  landscape: Dimensions;
  portrait: Dimensions;
};

type ContainerDimensionsMap = {
  square: Dimensions;
  landscape: Dimensions;
  portrait: Dimensions;
};

type ContainerOverhead = {
  topPadding: number;
  bottomPadding: number;
  title: number;
  buttonArea: number;
  total: number;
};

type VideoPreviewDimensions = {
  previewDimensionsMap: PreviewDimensionsMap;
  containerOverhead: ContainerOverhead;
  containerDimensionsMap: ContainerDimensionsMap;
};

/**
 * Get video preview dimensions based on orientation
 * Returns preview dimensions, container overhead, and container dimensions maps
 */
export function getVideoPreviewDimensions(): VideoPreviewDimensions {
  // Preview dimensions map - used for VideoPreview component
  // Dimensions match exact aspect ratios of generated videos to prevent cropping
  const previewDimensionsMap: PreviewDimensionsMap = {
    square: { width: 420, height: 420 }, // 1:1 ratio
    landscape: { width: 683, height: 384 }, // 1.7778:1 ratio (16:9)
    portrait: { width: 288, height: 512 }, // 0.5625:1 ratio (9:16)
  } as const;

  // Container overhead constants
  // Adjust these values to fine-tune container spacing
  const containerOverhead: ContainerOverhead = {
    topPadding: 16, // p-4 top = 16px
    bottomPadding: 8, // p-4 bottom = 8px (adjust this to change space below button)
    title: 36, // text height + mb-3
    buttonArea: 48, // mt-4 + button height
    get total() {
      return (
        this.topPadding + this.bottomPadding + this.title + this.buttonArea
      );
    },
  };

  // Container dimensions map - automatically calculated from preview + overhead
  // Container width matches preview width (padding is internal)
  // Container height = preview height + overhead
  const containerDimensionsMap: ContainerDimensionsMap = {
    square: {
      width: previewDimensionsMap.square.width,
      height: previewDimensionsMap.square.height + containerOverhead.total,
    },
    landscape: {
      width: previewDimensionsMap.landscape.width,
      height:
        previewDimensionsMap.landscape.height + containerOverhead.total,
    },
    portrait: {
      width: previewDimensionsMap.portrait.width,
      height: previewDimensionsMap.portrait.height + containerOverhead.total,
    },
  } as const;

  return {
    previewDimensionsMap,
    containerOverhead,
    containerDimensionsMap,
  };
}

