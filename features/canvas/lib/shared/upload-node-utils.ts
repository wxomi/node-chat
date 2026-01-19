import {
  extractImageDimensions,
  extractVideoDimensions,
  type Dimensions,
} from "../upload/dimension-extraction";

/**
 * Extracts dimensions from a file based on its type
 * @param file - The file to extract dimensions from
 * @param fileType - The type of file ("image", "video", or "audio")
 * @returns Promise resolving to dimensions object or null if extraction fails or type doesn't support dimensions
 */
export async function extractDimensionsFromFile(
  file: File,
  fileType: "image" | "video" | "audio"
): Promise<Dimensions | null> {
  if (fileType === "image") {
    return await extractImageDimensions(file);
  } else if (fileType === "video") {
    return await extractVideoDimensions(file);
  }
  // Audio files don't have dimensions
  return null;
}
