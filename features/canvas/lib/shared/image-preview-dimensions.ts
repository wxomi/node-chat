/**
 * Image preview dimensions utility
 * Provides dimension maps for image nodes based on orientation
 * Dimensions match exact aspect ratios of generated images to prevent cropping
 * Square: 512×512 (1:1), Landscape: 512×288 (1.7778:1), Portrait: 288×512 (0.5625:1)
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

type ImagePreviewDimensions = {
  previewDimensionsMap: PreviewDimensionsMap;
  containerOverhead: ContainerOverhead;
  containerDimensionsMap: ContainerDimensionsMap;
};

/**
 * Get image preview dimensions based on orientation
 * Returns preview dimensions, container overhead, and container dimensions maps
 */
export function getImagePreviewDimensions(): ImagePreviewDimensions {
  // Preview dimensions map - used for DynamicImagePreview component
  // Dimensions match exact aspect ratios of generated images to prevent cropping
  const previewDimensionsMap: PreviewDimensionsMap = {
    square: { width: 420, height: 420 }, // 1:1 ratio (matches 512×512)
    landscape: { width: 683, height: 384 }, // 1.7778:1 ratio (matches 512×288)
    portrait: { width: 288, height: 512 }, // 0.5625:1 ratio (matches 288×512)
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
      height: previewDimensionsMap.landscape.height + containerOverhead.total,
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
