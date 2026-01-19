"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.magichour.ai";

type AssetType = "image" | "video" | "audio";

type UploadUrlResponse = {
  items: Array<{
    upload_url: string;
    expires_at: string;
    file_path: string;
  }>;
};

// Valid extensions per asset type
const VALID_EXTENSIONS: Record<AssetType, string[]> = {
  image: ["png", "jpg", "jpeg", "webp", "avif", "jp2", "tiff", "bmp"],
  video: ["mp4", "m4v", "mov", "webm"],
  audio: ["mp3", "mpeg", "wav", "aac", "aiff", "flac"],
};

/**
 * Extract and validate file extension
 */
export const getFileExtension = (
  filename: string,
  assetType: AssetType
): string | null => {
  const parts = filename.split(".");
  if (parts.length < 2) {
    return null;
  }

  const extension = parts[parts.length - 1].toLowerCase();

  if (!VALID_EXTENSIONS[assetType].includes(extension)) {
    return null;
  }

  return extension;
};

/**
 * Get pre-signed upload URL from Magic Hour API
 */
export const getUploadUrl = async (
  assetType: AssetType,
  extension: string
): Promise<{ upload_url: string; expires_at: string; file_path: string }> => {
  const apiKey = process.env.NEXT_PUBLIC_MAGIC_HOUR_API_KEY;
  if (!apiKey) {
    throw new Error("Magic Hour API key is not configured");
  }

  const response = await fetch(`${API_BASE_URL}/v1/files/upload-urls`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      items: [
        {
          type: assetType,
          extension,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get upload URL");
  }

  const data: UploadUrlResponse = await response.json();
  return data.items[0];
};

/**
 * Upload file to pre-signed URL
 */
export const uploadFile = async (
  file: File,
  uploadUrl: string
): Promise<void> => {
  try {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    throw new Error("Failed to upload file");
  }
};
