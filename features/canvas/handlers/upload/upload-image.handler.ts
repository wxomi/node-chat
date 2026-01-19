"use client";

import { toast } from "sonner";
import useFlowStore from "../../stores/canvas-store";
import {
  getFileExtension,
  getUploadUrl,
  uploadFile,
} from "../../services/upload";

export async function handleUploadAsset(nodeId: string, file: File) {
  // Detect asset type from MIME type
  let assetType: "image" | "video" | "audio" = "image";
  if (file.type.startsWith("image/")) {
    assetType = "image";
  } else if (file.type.startsWith("video/")) {
    assetType = "video";
  } else if (file.type.startsWith("audio/")) {
    assetType = "audio";
  }

  // Validate that file has a valid extension
  const extension = getFileExtension(file.name, assetType);

  if (!extension) {
    const validExtensions = {
      image: "PNG, JPG, JPEG, WebP, AVIF, JP2, TIFF, BMP",
      video: "MP4, M4V, MOV, WebM",
      audio: "MP3, MPEG, WAV, AAC, AIFF, FLAC",
    };
    toast.error(
      `Invalid ${assetType} format. Supported formats: ${validExtensions[assetType]}`
    );
    return;
  }

  try {
    // Create local preview URL immediately
    const localPreviewUrl = URL.createObjectURL(file);

    // Update node to show uploading state with local preview
    useFlowStore.getState().updateNodeData(nodeId, {
      isUploading: true,
      uploadedFileName: file.name,
      previewUrl: localPreviewUrl, // Show local preview immediately
    });

    const toastId = toast.loading(`Uploading ${assetType}...`);

    // Get pre-signed upload URL from Magic Hour
    const uploadUrlResponse = await getUploadUrl(assetType, extension);

    const { upload_url: uploadUrl, file_path: filePath } = uploadUrlResponse;

    // Upload the file to pre-signed URL
    await uploadFile(file, uploadUrl);

    toast.dismiss(toastId);
    toast.success(
      `${
        assetType.charAt(0).toUpperCase() + assetType.slice(1)
      } uploaded successfully!`
    );

    // Update node data with backend URL for downstream nodes
    useFlowStore.getState().updateNodeData(nodeId, {
      filePath, // Raw file path for direct API use
      previewUrl: localPreviewUrl, // Keep local preview URL
      ...(assetType === "video" && {
        videoDetails: {
          downloads: [
            {
              url: filePath,
              expires_at: uploadUrlResponse.expires_at,
            },
          ],
        },
      }),
      ...(assetType === "audio" && {
        audioDetails: {
          downloads: [
            {
              url: filePath,
              expires_at: uploadUrlResponse.expires_at,
            },
          ],
        },
      }),
      ...(assetType === "image" && {
        imageDetails: {
          downloads: [
            {
              url: filePath,
              expires_at: uploadUrlResponse.expires_at,
            },
          ],
        },
      }),
      uploadedFileName: file.name,
      isUploading: false,
    });
  } catch (error) {
    toast.dismiss();

    // Clear the preview and go back to normal state
    useFlowStore.getState().updateNodeData(nodeId, {
      previewUrl: undefined,
      isUploading: false,
    });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    toast.error(`Upload failed: ${errorMessage}`);
  }
}
