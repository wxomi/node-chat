import { z } from "zod";

// Define supported file extensions per type
const SUPPORTED_EXTENSIONS = {
  video: ["mp4", "m4v", "mov", "webm"] as const,
  audio: ["mp3", "mpeg", "wav", "aac", "aiff", "flac"] as const,
  image: ["png", "jpg", "jpeg", "webp", "avif", "jp2", "tiff", "bmp"] as const,
  imageWithGif: [
    "png",
    "jpg",
    "jpeg",
    "webp",
    "avif",
    "jp2",
    "tiff",
    "bmp",
    "gif",
  ] as const,
};

// Schema for validating file uploads
export const videoFileSchema = z.object({
  filePath: z.string(),
  extension: z.enum(SUPPORTED_EXTENSIONS.video),
  uploadUrl: z.url().optional(),
  expiresAt: z.iso.datetime().optional(),
});

export const audioFileSchema = z.object({
  filePath: z.string(),
  extension: z.enum(SUPPORTED_EXTENSIONS.audio),
  uploadUrl: z.url().optional(),
  expiresAt: z.iso.datetime().optional(),
});

export const imageFileSchema = z.object({
  filePath: z.string(),
  extension: z.enum(SUPPORTED_EXTENSIONS.image),
  uploadUrl: z.url().optional(),
  expiresAt: z.iso.datetime().optional(),
});

export const imageFileWithGifSchema = z.object({
  filePath: z.string(),
  extension: z.enum(SUPPORTED_EXTENSIONS.imageWithGif),
  uploadUrl: z.url().optional(),
  expiresAt: z.iso.datetime().optional(),
});

// Helper function to validate file extension
export const validateFileExtension = (
  filePath: string,
  type: "video" | "audio" | "image" | "imageWithGif"
): boolean => {
  const extension = filePath.split(".").pop()?.toLowerCase();
  if (!extension) return false;
  return SUPPORTED_EXTENSIONS[type].includes(extension as never);
};

// Export types
export type VideoFile = z.infer<typeof videoFileSchema>;
export type AudioFile = z.infer<typeof audioFileSchema>;
export type ImageFile = z.infer<typeof imageFileSchema>;
export type ImageFileWithGif = z.infer<typeof imageFileWithGifSchema>;

// Validation functions for video files
export const validateVideoFile = (data: unknown): VideoFile => {
  return videoFileSchema.parse(data);
};

export const safeValidateVideoFile = (data: unknown) => {
  return videoFileSchema.safeParse(data);
};

// Validation functions for audio files
export const validateAudioFile = (data: unknown): AudioFile => {
  return audioFileSchema.parse(data);
};

export const safeValidateAudioFile = (data: unknown) => {
  return audioFileSchema.safeParse(data);
};

// Validation functions for image files
export const validateImageFile = (data: unknown): ImageFile => {
  return imageFileSchema.parse(data);
};

export const safeValidateImageFile = (data: unknown) => {
  return imageFileSchema.safeParse(data);
};

// Validation functions for image files with gif support
export const validateImageFileWithGif = (data: unknown): ImageFileWithGif => {
  return imageFileWithGifSchema.parse(data);
};

export const safeValidateImageFileWithGif = (data: unknown) => {
  return imageFileWithGifSchema.safeParse(data);
};
