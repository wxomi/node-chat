import { z } from "zod";

// Zod schema for prompt node data
export const promptNodeDataSchema = z.object({
  prompt: z.string().optional(),
});

// Infer the TypeScript type from the schema
export type PromptNodeData = z.infer<typeof promptNodeDataSchema>;

// Validation function
export const validatePromptNodeData = (data: unknown): PromptNodeData => {
  return promptNodeDataSchema.parse(data);
};

// Safe validation function (returns success/error)
export const safeValidatePromptNodeData = (data: unknown) => {
  return promptNodeDataSchema.safeParse(data);
};
