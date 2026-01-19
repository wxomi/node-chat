import { z } from "zod";
import { faceMappingSchema } from "../shared/face-mapping.validation";

const FACE_SWAP_MODES = ["all-faces", "individual-faces"] as const;
const IMAGE_SOURCES = ["file", "youtube"] as const;

// Zod schema for Face Swap Photo API call
export const faceSwapConfigSchema = z
  .object({
    faceSwapMode: z.enum(FACE_SWAP_MODES).default("all-faces"),
    sourceFilePath: z.string().min(1, "Source file path is required"),
    targetFilePath: z.string().min(1, "Target file path is required"),
    faceMappings: z.array(faceMappingSchema).optional(),
    name: z.string().optional(),
    assets: z.object({
      imageSource: z.enum(IMAGE_SOURCES).default("file"),
      youtubeUrl: z.string().url().optional(),
    }),
  })
  .refine(
    (data) => {
      // If mode is individual-faces, faceMappings must be provided
      if (data.faceSwapMode === "individual-faces") {
        return data.faceMappings && data.faceMappings.length > 0;
      }
      return true;
    },
    {
      message: "Face mappings are required for individual-faces mode",
      path: ["faceMappings"],
    }
  );

// Zod schema for Face Swap node config (stored in config store)
export const faceSwapNodeConfigSchema = z.object({
  faceSwapMode: z.enum(FACE_SWAP_MODES).default("all-faces"),
  name: z.string().optional(),
  orientation: z.enum(["square", "landscape", "portrait"]).default("square"),
  assets: z.object({
    imageSource: z.enum(IMAGE_SOURCES).default("file"),
    youtubeUrl: z.string().optional(),
  }),
});

// Zod schema for Face Swap node data
export const faceSwapNodeDataSchema = z.object({
  config: faceSwapConfigSchema.optional(),
});

// Infer the TypeScript types from the schemas
export type FaceSwapConfig = z.infer<typeof faceSwapConfigSchema>;
export type FaceSwapNodeConfig = z.infer<typeof faceSwapNodeConfigSchema>;
export type FaceSwapNodeData = z.infer<typeof faceSwapNodeDataSchema>;

// Validation functions for config
export const validateFaceSwapConfig = (data: unknown): FaceSwapConfig => {
  return faceSwapConfigSchema.parse(data);
};

export const safeValidateFaceSwapConfig = (data: unknown) => {
  return faceSwapConfigSchema.safeParse(data);
};

// Validation functions for node data
export const validateFaceSwapNodeData = (data: unknown): FaceSwapNodeData => {
  return faceSwapNodeDataSchema.parse(data);
};

export const safeValidateFaceSwapNodeData = (data: unknown) => {
  return faceSwapNodeDataSchema.safeParse(data);
};
