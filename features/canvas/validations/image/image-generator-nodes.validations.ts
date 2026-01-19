import { z } from "zod";

// Supported art generation tools from Magic Hour API
const AI_IMAGE_TOOLS = [
  "general",
  "ai-anime-generator",
  "ai-art-generator",
  "ai-background-generator",
  "ai-character-generator",
  "ai-face-generator",
  "ai-fashion-generator",
  "ai-icon-generator",
  "ai-illustration-generator",
  "ai-interior-design-generator",
  "ai-landscape-generator",
  "ai-logo-generator",
  "ai-manga-generator",
  "ai-outfit-generator",
  "ai-pattern-generator",
  "ai-photo-generator",
  "ai-sketch-generator",
  "ai-tattoo-generator",
  "album-cover-generator",
  "animated-characters-generator",
  "architecture-generator",
  "book-cover-generator",
  "comic-book-generator",
  "dark-fantasy-ai",
  "disney-ai-generator",
  "dnd-ai-art-generator",
  "emoji-generator",
  "fantasy-map-generator",
  "graffiti-generator",
  "movie-poster-generator",
  "optical-illusion-generator",
  "pokemon-generator",
  "south-park-character-generator",
  "superhero-generator",
  "thumbnail-maker",
] as const;

// Extract the tool type from AI_IMAGE_TOOLS
export type AIImageTool = (typeof AI_IMAGE_TOOLS)[number];

// Zod schema for image data structure from Magic Hour API
const imageSchema = z.object({
  filePath: z.string(),
  uploadUrl: z.string().url(),
  expiresAt: z.string(),
});

// Zod schema for image generator configuration
export const imageGeneratorConfigSchema = z.object({
  imageCount: z.number().min(1).max(4).default(1),
  orientation: z.enum(["square", "landscape", "portrait"]).default("landscape"),
  style: z.object({
    prompt: z.string().min(1, "Prompt is required"),
    tool: z.enum(AI_IMAGE_TOOLS).default("general"),
  }),
  name: z.string().optional(),
});

// Zod schema for image generator node data
export const imageGeneratorNodeDataSchema = z.object({
  config: imageGeneratorConfigSchema.optional(),
  image: imageSchema.optional(),
});

// Infer the TypeScript types from the schemas
export type ImageData = z.infer<typeof imageSchema>;
export type ImageGeneratorConfig = z.infer<typeof imageGeneratorConfigSchema>;
export type ImageGeneratorNodeData = z.infer<
  typeof imageGeneratorNodeDataSchema
>;

// Validation functions for config
export const validateImageGeneratorConfig = (
  data: unknown
): ImageGeneratorConfig => {
  return imageGeneratorConfigSchema.parse(data);
};

export const safeValidateImageGeneratorConfig = (data: unknown) => {
  return imageGeneratorConfigSchema.safeParse(data);
};

// Validation functions for node data
export const validateImageGeneratorNodeData = (
  data: unknown
): ImageGeneratorNodeData => {
  return imageGeneratorNodeDataSchema.parse(data);
};

export const safeValidateImageGeneratorNodeData = (data: unknown) => {
  return imageGeneratorNodeDataSchema.safeParse(data);
};
