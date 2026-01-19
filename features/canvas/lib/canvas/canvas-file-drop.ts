"use client";

import { toast } from "sonner";
import useFlowStore from "../../stores/canvas-store";
import { handleUploadAsset } from "../../handlers/upload";
import {
  getFileExtension,
  isValidFileExtension,
  detectAssetTypeFromMime,
} from "../upload";
import { extractDimensionsFromFile } from "../shared";
import { FILE_TYPE_INFO } from "../../constants/upload/upload-constants";

type UploadedAsset = {
  id: string;
  type: "image" | "video" | "audio";
  fileName: string;
  previewUrl: string;
  filePath: string;
  isUploading: boolean;
  width?: number;
  height?: number;
};

/**
 * Validates and filters valid media files from a drag event
 * @param event - The drag event containing files
 * @returns Object with valid files array and any error message
 */
export function validateCanvasFileDrop(event: React.DragEvent): {
  validFiles: File[];
  hasError: boolean;
  errorMessage?: string;
} {
  const files = Array.from(event.dataTransfer.files);
  
  if (files.length === 0) {
    return { validFiles: [], hasError: false };
  }

  const validFiles: File[] = [];
  const invalidFiles: string[] = [];

  for (const file of files) {
    // Skip non-media files (must be image, video, or audio MIME type)
    if (
      !file.type.startsWith("image/") &&
      !file.type.startsWith("video/") &&
      !file.type.startsWith("audio/")
    ) {
      invalidFiles.push(file.name);
      continue;
    }

    // Detect file type from MIME type
    const fileType = detectAssetTypeFromMime(file.type);

    const extension = getFileExtension(file.name);
    if (isValidFileExtension(fileType, extension)) {
      validFiles.push(file);
    } else {
      invalidFiles.push(file.name);
    }
  }

  // If no valid files, return error
  if (validFiles.length === 0) {
    return {
      validFiles: [],
      hasError: true,
      errorMessage: `Invalid file type. Supported: ${FILE_TYPE_INFO.image.extensions}, ${FILE_TYPE_INFO.video.extensions}, ${FILE_TYPE_INFO.audio.extensions}`,
    };
  }

  // If some files are invalid, show warning but continue with valid ones
  if (invalidFiles.length > 0) {
    toast.warning(
      `Skipped ${invalidFiles.length} invalid file(s): ${invalidFiles.slice(0, 3).join(", ")}${invalidFiles.length > 3 ? "..." : ""}`
    );
  }

  return { validFiles, hasError: false };
}

/**
 * Creates an upload-node at the specified position and populates it with files
 * @param files - Array of valid media files to upload
 * @param position - Position to create the node at
 * @returns The created node ID, or null if creation failed
 */
export async function createUploadNodeWithFiles(
  files: File[],
  position: { x: number; y: number }
): Promise<string | null> {
  if (files.length === 0) {
    return null;
  }

  // Create upload-node at position
  const nodeId = useFlowStore.getState().addNode("upload-node", position);

  if (!nodeId) {
    return null;
  }

  // Initialize uploadedAssets array
  const uploadedAssets: UploadedAsset[] = [];

  // Process each file
  for (const file of files) {
    const assetId = `${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Detect file type from MIME type
    const fileType = detectAssetTypeFromMime(file.type);

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);

    // Extract dimensions based on asset type
    const dimensions = await extractDimensionsFromFile(file, fileType);

    // Create asset object matching upload-node.tsx pattern
    const newAsset: UploadedAsset = {
      id: assetId,
      type: fileType,
      fileName: file.name,
      previewUrl,
      filePath: "",
      isUploading: true,
      ...(dimensions && {
        width: dimensions.width,
        height: dimensions.height,
      }),
    };

    uploadedAssets.push(newAsset);

    // Trigger upload for each file (fire and forget, same as upload-node.tsx)
    void handleUploadAsset(nodeId, file);
  }

  // Update node with all uploaded assets
  useFlowStore.getState().updateNodeData(nodeId, {
    uploadedAssets,
  });

  return nodeId;
}

/**
 * Handles file drop on canvas - validates files and creates upload-node
 * @param event - The drag event
 * @param position - Position to create the node at (in flow coordinates)
 * @returns The created node ID, or null if no valid files or creation failed
 */
export async function handleCanvasFileDrop(
  event: React.DragEvent,
  position: { x: number; y: number }
): Promise<string | null> {
  // Validate files
  const { validFiles, hasError, errorMessage } = validateCanvasFileDrop(event);

  if (hasError) {
    if (errorMessage) {
      toast.error(errorMessage);
    }
    return null;
  }

  if (validFiles.length === 0) {
    return null;
  }

  // Create upload-node and populate with files
  return await createUploadNodeWithFiles(validFiles, position);
}

