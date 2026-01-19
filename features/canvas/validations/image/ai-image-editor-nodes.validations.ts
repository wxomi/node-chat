import { z } from "zod";

// Zod schema for AI Image Editor configuration
export const aiImageEditorConfigSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  imageFilePath: z.string().min(1, "Image file path is required"),
  name: z.string().optional(),
});

// Zod schema for AI Image Editor node config (used in config store)
export const aiImageEditorNodeConfigSchema = z.object({
  prompt: z.string().default(""),
  name: z.string().optional(),
  orientation: z.enum(["square", "landscape", "portrait"]).default("square"),
});

// Zod schema for AI Image Editor node data
export const aiImageEditorNodeDataSchema = z.object({
  config: aiImageEditorConfigSchema.optional(),
});

// Infer the TypeScript types from the schemas
export type AIImageEditorConfig = z.infer<typeof aiImageEditorConfigSchema>;
export type AIImageEditorNodeConfig = z.infer<
  typeof aiImageEditorNodeConfigSchema
>;
export type AIImageEditorNodeData = z.infer<typeof aiImageEditorNodeDataSchema>;

// Validation functions for config
export const validateAIImageEditorConfig = (
  data: unknown
): AIImageEditorConfig => {
  return aiImageEditorConfigSchema.parse(data);
};

export const safeValidateAIImageEditorConfig = (data: unknown) => {
  return aiImageEditorConfigSchema.safeParse(data);
};

// Validation functions for node data
export const validateAIImageEditorNodeData = (
  data: unknown
): AIImageEditorNodeData => {
  return aiImageEditorNodeDataSchema.parse(data);
};

export const safeValidateAIImageEditorNodeData = (data: unknown) => {
  return aiImageEditorNodeDataSchema.safeParse(data);
};
