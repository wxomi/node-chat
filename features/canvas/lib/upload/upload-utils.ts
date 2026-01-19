import {
  VALID_EXTENSIONS,
  ICON_CONFIG,
  MIME_TO_EXT,
} from "../../constants/upload/upload-constants";

/**
 * Extract file extension from filename
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop()?.toLowerCase() || "";
};

/**
 * Check if file extension is valid for the given file type
 */
export const isValidFileExtension = (
  fileType: "image" | "video" | "audio",
  extension: string
): boolean => {
  return (VALID_EXTENSIONS[fileType] as readonly string[]).includes(extension);
};

/**
 * Get icon configuration for the given file type
 */
export const getIconConfig = (
  fileType: "image" | "video" | "audio" | null,
  isDragOver: boolean
) => {
  if (isDragOver && fileType) {
    return ICON_CONFIG[fileType];
  }
  return ICON_CONFIG.default;
};

/**
 * Detect asset type from MIME type
 */
export const detectAssetTypeFromMime = (
  mimeType: string
): "image" | "video" | "audio" => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "image"; // default
};

/**
 * Get file extension from MIME type for drag detection
 */
export const getExtensionFromMimeType = (mimeType: string): string => {
  return MIME_TO_EXT[mimeType] || "unknown";
};

/**
 * Capitalize first letter of string
 */
export const capitalizeFirst = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
