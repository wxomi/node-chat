import { z } from "zod";

// Enum for scale factors
const SCALE_FACTORS = [2, 4] as const;
const ENHANCEMENTS = ["Resemblance", "Balanced", "Creative"] as const;

// Zod schema for AI Image Upscaler configuration (API call)
export const aiImageUpscalerConfigSchema = z
  .object({
    scaleFactor: z.enum(["2", "4"]),
    enhancement: z.enum(ENHANCEMENTS),
    prompt: z.string().default(""),
    imageFilePath: z.string().min(1, "Image file path is required"),
    name: z.string().optional(),
  })
  .refine(
    (data) => {
      // If enhancement is Creative, prompt must be provided and non-empty
      if (data.enhancement === "Creative") {
        return data.prompt && data.prompt.trim().length > 0;
      }
      // For other enhancements, prompt is optional (can be empty)
      return true;
    },
    {
      message: "Prompt is required when enhancement is set to Creative",
      path: ["prompt"],
    }
  );

// Zod schema for AI Image Upscaler node config (used in config store)
export const aiImageUpscalerNodeConfigSchema = z.object({
  scaleFactor: z.enum(["2", "4"]).default("2"),
  enhancement: z.enum(ENHANCEMENTS).default("Balanced"),
  prompt: z.string().default(""),
  name: z.string().optional(),
  orientation: z.enum(["square", "landscape", "portrait"]).default("square"),
});

// Zod schema for AI Image Upscaler node data
export const aiImageUpscalerNodeDataSchema = z.object({
  config: aiImageUpscalerConfigSchema.optional(),
});

// Infer the TypeScript types from the schemas
export type AIImageUpscalerConfig = z.infer<typeof aiImageUpscalerConfigSchema>;
export type AIImageUpscalerNodeConfig = z.infer<
  typeof aiImageUpscalerNodeConfigSchema
>;
export type AIImageUpscalerNodeData = z.infer<
  typeof aiImageUpscalerNodeDataSchema
>;

// Validation functions for config
export const validateAIImageUpscalerConfig = (
  data: unknown
): AIImageUpscalerConfig => {
  return aiImageUpscalerConfigSchema.parse(data);
};

export const safeValidateAIImageUpscalerConfig = (data: unknown) => {
  return aiImageUpscalerConfigSchema.safeParse(data);
};

// Validation functions for node data
export const validateAIImageUpscalerNodeData = (
  data: unknown
): AIImageUpscalerNodeData => {
  return aiImageUpscalerNodeDataSchema.parse(data);
};

export const safeValidateAIImageUpscalerNodeData = (data: unknown) => {
  return aiImageUpscalerNodeDataSchema.safeParse(data);
};
