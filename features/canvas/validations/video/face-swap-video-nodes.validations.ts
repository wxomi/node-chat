import { z } from "zod";
import { faceMappingSchema } from "../shared/face-mapping.validation";

const FACE_SWAP_MODES = ["all-faces", "individual-faces"] as const;
const VERSION_OPTIONS = ["v1", "v2", "default"] as const;
const VIDEO_SOURCES = ["file", "youtube"] as const;

// API config schema
export const faceSwapVideoConfigSchema = z
  .object({
    name: z.string().optional(),
    startSeconds: z.number().min(0),
    endSeconds: z.number().min(0.1),
    style: z.object({
      version: z.enum(VERSION_OPTIONS).default("default"),
    }),
    assets: z.object({
      faceSwapMode: z.enum(FACE_SWAP_MODES).default("all-faces"),
      imageFilePath: z.string().optional(), // For all-faces mode
      faceMappings: z.array(faceMappingSchema).max(5).optional(),
      videoSource: z.enum(VIDEO_SOURCES),
      videoFilePath: z.string().optional(),
      youtubeUrl: z.string().url().optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.assets.faceSwapMode === "all-faces") {
        return !!data.assets.imageFilePath?.trim();
      }
      return true;
    },
    {
      message: "Source face image is required for all-faces mode",
      path: ["assets", "imageFilePath"],
    }
  )
  .refine(
    (data) => {
      if (data.assets.faceSwapMode === "individual-faces") {
        return data.assets.faceMappings && data.assets.faceMappings.length > 0;
      }
      return true;
    },
    {
      message: "Face mappings are required for individual-faces mode",
      path: ["assets", "faceMappings"],
    }
  )
  .refine(
    (data) => {
      if (data.assets.videoSource === "file") {
        return !!data.assets.videoFilePath?.trim();
      }
      return true;
    },
    {
      message: "Video file path is required when video source is file",
      path: ["assets", "videoFilePath"],
    }
  )
  .refine(
    (data) => {
      if (data.assets.videoSource === "youtube") {
        return !!data.assets.youtubeUrl?.trim();
      }
      return true;
    },
    {
      message: "YouTube URL is required when video source is youtube",
      path: ["assets", "youtubeUrl"],
    }
  );

// Node config schema (for config store)
export const faceSwapVideoNodeConfigSchema = z.object({
  name: z.string().optional(),
  startSeconds: z.number().min(0).default(0),
  endSeconds: z.number().min(0.1).default(15),
  orientation: z.enum(["square", "landscape", "portrait"]).default("square"),
  style: z.object({
    version: z.enum(VERSION_OPTIONS).default("default"),
  }),
  assets: z.object({
    faceSwapMode: z.enum(FACE_SWAP_MODES).default("all-faces"),
    videoSource: z.enum(VIDEO_SOURCES).default("file"),
    youtubeUrl: z.string().optional(),
  }),
});

export type FaceSwapVideoConfig = z.infer<typeof faceSwapVideoConfigSchema>;
export type FaceSwapVideoNodeConfig = z.infer<
  typeof faceSwapVideoNodeConfigSchema
>;

export const validateFaceSwapVideoConfig = (
  data: unknown
): FaceSwapVideoConfig => {
  return faceSwapVideoConfigSchema.parse(data);
};

export const safeValidateFaceSwapVideoConfig = (data: unknown) => {
  return faceSwapVideoConfigSchema.safeParse(data);
};

export const validateFaceSwapVideoNodeConfig = (
  data: unknown
): FaceSwapVideoNodeConfig => {
  return faceSwapVideoNodeConfigSchema.parse(data);
};

export const safeValidateFaceSwapVideoNodeConfig = (data: unknown) => {
  return faceSwapVideoNodeConfigSchema.safeParse(data);
};

