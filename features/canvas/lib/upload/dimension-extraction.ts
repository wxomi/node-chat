/**
 * Dimension extraction utilities for uploaded assets
 * Extracts width and height from image/video files and calculates orientation
 */

export type Orientation = "square" | "landscape" | "portrait";

export type Dimensions = {
  width: number;
  height: number;
};

/**
 * Extracts dimensions from an image file
 * @param file - The image file to extract dimensions from
 * @returns Promise resolving to dimensions object or null if extraction fails
 */
export async function extractImageDimensions(
  file: File
): Promise<Dimensions | null> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}

/**
 * Extracts dimensions from a video file
 * @param file - The video file to extract dimensions from
 * @returns Promise resolving to dimensions object or null if extraction fails
 */
export async function extractVideoDimensions(
  file: File
): Promise<Dimensions | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    video.src = url;
    video.load();
  });
}

/**
 * Calculates orientation from dimensions based on aspect ratio
 * @param width - Image/video width
 * @param height - Image/video height
 * @returns Orientation string: "square", "landscape", or "portrait"
 */
export function calculateOrientationFromDimensions(
  width: number,
  height: number
): Orientation {
  if (width === 0 || height === 0) {
    return "square";
  }

  const aspectRatio = width / height;
  const threshold = 0.1;

  // Check if aspect ratio is close to 1:1 (square)
  if (Math.abs(aspectRatio - 1) < threshold) {
    return "square";
  }

  // Landscape if width > height, portrait otherwise
  return aspectRatio > 1 ? "landscape" : "portrait";
}
