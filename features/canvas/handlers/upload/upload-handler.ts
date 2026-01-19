"use client";

import { toast } from "sonner";
import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import {
  getFileExtension,
  getUploadUrl,
  uploadFile,
} from "../../services/upload";
import { calculateOrientationFromDimensions } from "../../lib/upload";
import { extractDimensionsFromFile } from "../../lib/shared";
import { NodeFlowConfig } from "../../types/sidebar.types";

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

    // Extract dimensions based on asset type
    const dimensions = await extractDimensionsFromFile(file, assetType);

    // Calculate orientation if dimensions are available
    let calculatedOrientation: "square" | "landscape" | "portrait" | null =
      null;
    if (dimensions) {
      calculatedOrientation = calculateOrientationFromDimensions(
        dimensions.width,
        dimensions.height
      );
      // Update node config with calculated orientation
      const nodeConfigs = useConfigStore.getState().nodeConfigs;
      const currentNodeConfig = nodeConfigs[nodeId];
      if (
        calculatedOrientation &&
        currentNodeConfig?.orientation !== calculatedOrientation
      ) {
        useConfigStore.getState().updateNodeConfig(nodeId, {
          ...currentNodeConfig,
          orientation: calculatedOrientation,
        });
      }
    }

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

    // Update uploadedAssets with filePath and dimensions - read fresh state to avoid race conditions
    const freshNode = useFlowStore
      .getState()
      .nodes.find((n) => n.id === nodeId);
    const freshUploadedAssets = freshNode?.data?.uploadedAssets as
      | Array<{
          id: string;
          type: "image" | "video" | "audio";
          fileName: string;
          previewUrl: string;
          filePath: string;
          isUploading?: boolean;
          width?: number;
          height?: number;
        }>
      | undefined;

    if (freshUploadedAssets) {
      // Match by fileName AND assetType to avoid conflicts
      const updatedAssets = freshUploadedAssets.map((asset) => {
        const isMatch =
          asset.fileName === file.name && asset.type === assetType;
        return isMatch
          ? {
              ...asset,
              filePath,
              isUploading: false,
              ...(dimensions && {
                width: dimensions.width,
                height: dimensions.height,
              }),
            }
          : asset;
      });

      const updatedAsset = updatedAssets.find(
        (a) => a.fileName === file.name && a.type === assetType
      );

      useFlowStore.getState().updateNodeData(nodeId, {
        uploadedAssets: updatedAssets,
      });
    } else {
      // No uploadedAssets found in node data
    }
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

export async function handleSingleUploadAsset(nodeId: string, file: File) {
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
    // Check existing connections and only remove incompatible ones
    const currentEdges = useFlowStore.getState().edges;
    const nodes = useFlowStore.getState().nodes;
    const existingConnections = currentEdges.filter(
      (edge) => edge.source === nodeId && edge.sourceHandle === "asset-output"
    );

    if (existingConnections.length > 0) {
      // Find incompatible connections to remove
      const edgesToRemove = existingConnections.filter((edge) => {
        // Get target node and its flowConfig
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (!targetNode || !edge.targetHandle) {
          return true; // Remove if target node or handle doesn't exist
        }

        const targetFlowConfig = targetNode.data?.flowConfig as
          | NodeFlowConfig
          | undefined;
        if (!targetFlowConfig?.inputs) {
          return true; // Remove if target has no inputs
        }

        // Find the target input handle
        const targetHandle = targetFlowConfig.inputs.find(
          (h) => h.id === edge.targetHandle
        );
        if (!targetHandle) {
          return true; // Remove if target handle not found
        }

        // Connection is compatible if:
        // 1. Asset type matches target handle dataType, OR
        // 2. Target accepts "string" (always compatible)
        const isCompatible =
          assetType === targetHandle.dataType ||
          targetHandle.dataType === "string";

        // Remove if incompatible
        return !isCompatible;
      });

      // Remove only incompatible connections
      if (edgesToRemove.length > 0) {
        edgesToRemove.forEach((edge) => {
          useFlowStore
            .getState()
            .onEdgesChange([{ type: "remove", id: edge.id }]);
        });
      }
    }

    // Create local preview URL immediately
    const localPreviewUrl = URL.createObjectURL(file);

    // Extract dimensions based on asset type
    const dimensions = await extractDimensionsFromFile(file, assetType);

    // Calculate orientation if dimensions are available
    let calculatedOrientation: "square" | "landscape" | "portrait" | null =
      null;
    if (dimensions) {
      calculatedOrientation = calculateOrientationFromDimensions(
        dimensions.width,
        dimensions.height
      );
      // Update node config with calculated orientation
      const nodeConfigs = useConfigStore.getState().nodeConfigs;
      const currentNodeConfig = nodeConfigs[nodeId];
      if (
        calculatedOrientation &&
        currentNodeConfig?.orientation !== calculatedOrientation
      ) {
        useConfigStore.getState().updateNodeConfig(nodeId, {
          ...currentNodeConfig,
          orientation: calculatedOrientation,
        });
      }
    }

    // Update node to show uploading state with local preview
    useFlowStore.getState().updateNodeData(nodeId, {
      isUploading: true,
      fileName: file.name,
      assetType: null, // Clear type during upload
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

    // Update node data with backend URL for downstream nodes - replace existing asset
    useFlowStore.getState().updateNodeData(nodeId, {
      filePath, // Raw file path for direct API use
      previewUrl: localPreviewUrl, // Keep local preview URL
      assetType, // Set asset type
      fileName: file.name,
      ...(dimensions && {
        imageDimensions: dimensions,
      }),
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
      isUploading: false,
    });
  } catch (error) {
    toast.dismiss();

    // Clear the preview and go back to normal state
    useFlowStore.getState().updateNodeData(nodeId, {
      previewUrl: undefined,
      assetType: null,
      fileName: null,
      isUploading: false,
    });

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    toast.error(`Upload failed: ${errorMessage}`);
  }
}
