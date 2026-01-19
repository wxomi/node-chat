import { z } from "zod";

// Zod schema for Remove Background configuration (API call)
export const removeBackgroundConfigSchema = z.object({
  imageFilePath: z.string().min(1, "Image file path is required"),
  backgroundImageFilePath: z.string().optional(),
  name: z.string().optional(),
});

// Zod schema for Remove Background node config (used in config store)
export const removeBackgroundNodeConfigSchema = z.object({
  orientation: z.enum(["square", "landscape", "portrait"]).default("square"),
});

// Zod schema for Remove Background node data
export const removeBackgroundNodeDataSchema = z.object({
  config: removeBackgroundConfigSchema.optional(),
});

// Infer the TypeScript types from the schemas
export type RemoveBackgroundConfig = z.infer<
  typeof removeBackgroundConfigSchema
>;
export type RemoveBackgroundNodeConfig = z.infer<
  typeof removeBackgroundNodeConfigSchema
>;
export type RemoveBackgroundNodeData = z.infer<
  typeof removeBackgroundNodeDataSchema
>;

// Validation functions for config
export const validateRemoveBackgroundConfig = (
  data: unknown
): RemoveBackgroundConfig => {
  return removeBackgroundConfigSchema.parse(data);
};

export const safeValidateRemoveBackgroundConfig = (data: unknown) => {
  return removeBackgroundConfigSchema.safeParse(data);
};

// Validation functions for node data
export const validateRemoveBackgroundNodeData = (
  data: unknown
): RemoveBackgroundNodeData => {
  return removeBackgroundNodeDataSchema.parse(data);
};

export const safeValidateRemoveBackgroundNodeData = (data: unknown) => {
  return removeBackgroundNodeDataSchema.safeParse(data);
};
