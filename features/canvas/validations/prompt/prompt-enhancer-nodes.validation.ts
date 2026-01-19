import { z } from "zod";

// Zod schema for prompt enhancer node data
export const promptEnhancerNodeDataSchema = z.object({
  prompt: z.string().optional(),
});

// Infer the TypeScript type from the schema
export type PromptEnhancerNodeData = z.infer<
  typeof promptEnhancerNodeDataSchema
>;

// Validation function
export const validatePromptEnhancerNodeData = (
  data: unknown
): PromptEnhancerNodeData => {
  return promptEnhancerNodeDataSchema.parse(data);
};

// Safe validation function (returns success/error)
export const safeValidatePromptEnhancerNodeData = (data: unknown) => {
  return promptEnhancerNodeDataSchema.safeParse(data);
};
