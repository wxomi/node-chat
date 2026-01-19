import { z } from "zod";

// Enum for resolution options
const RESOLUTIONS = ["480p", "720p", "1080p"] as const;

// Enum for video generation modes
const VIDEO_GENERATION_MODES = [
  "image-to-video",
  "video-to-video",
  "text-to-video",
] as const;

// Art styles for video-to-video
const ART_STYLES = [
  "Minecraft",
  "Watercolor",
  "Lego",
  "GTA",
  "Clay",
  "Retro Sci-Fi",
  "Pixel",
  "Origami",
  "Ghost",
  "Underwater",
  "Cyberpunk",
  "Sub-Zero",
  "Studio Ghibli",
  "Impressionism",
  "Master Chief",
  "Solid Snake",
  "Street Fighter",
  "Hologram",
  "Mystique",
  "3D Render",
  "Airbender",
  "Android",
  "Anime Warrior",
  "Armored Knight",
  "Assassin's Creed",
  "Avatar",
  "Black Spiderman",
  "Boba Fett",
  "Celestial Skin",
  "Chinese Swordsmen",
  "Comic",
  "Cypher",
  "Dark Fantasy",
  "Dragonball Z",
  "Future Bot",
  "Futuristic Fantasy",
  "Gundam",
  "Illustration",
  "Ink",
  "Ink Poster",
  "Jinx",
  "Knight",
  "Link",
  "Marble",
  "Mario",
  "Mech",
  "Naruto",
  "Neon Dream",
  "No Art Style",
  "Oil Painting",
  "On Fire",
  "Pixar",
  "Power Armor",
  "Power Ranger",
  "Retro Anime",
  "Samurai",
  "Samurai Bot",
  "Spartan",
  "Starfield",
  "The Void",
  "Tomb Raider",
  "Van Gogh",
  "Viking",
  "Wu Kong",
  "Zelda",
  "Painterly Anime",
  "Realistic Anime",
  "Bold Anime",
  "Wuxia Anime",
  "Soft Anime",
  "Radiant Anime",
  "Sharp Anime",
  "Ghibli Anime",
] as const;

const VERSION_OPTIONS = ["v1", "v2", "default"] as const;
const PROMPT_TYPE_OPTIONS = ["default", "custom", "append_default"] as const;
const MODEL_OPTIONS = [
  "Dreamshaper",
  "Absolute Reality",
  "Flat 2D Anime",
  "Soft Anime",
  "Kaywaii",
  "default",
] as const;
const ORIENTATION_OPTIONS = ["portrait", "landscape", "square"] as const;

// Text-to-Video config schema
const textToVideoConfigSchema = z.object({
  mode: z.literal("text-to-video"),
  endSeconds: z.number().min(5).max(60),
  resolution: z.enum(RESOLUTIONS),
  prompt: z.string().min(1, "Prompt is required for text-to-video"),
  orientation: z.enum(ORIENTATION_OPTIONS),
  name: z.string().optional(),
});

// Image-to-Video config schema
const imageToVideoConfigSchema = z.object({
  mode: z.literal("image-to-video"),
  endSeconds: z.number().min(5).max(60),
  resolution: z.enum(RESOLUTIONS),
  imageFilePath: z.string().min(1, "Image file path is required"),
  name: z.string().optional(),
});

// Video-to-Video config schema
const videoToVideoConfigSchema = z.object({
  mode: z.literal("video-to-video"),
  startSeconds: z.number().min(0),
  endSeconds: z.number().min(0.1),
  fpsResolution: z.enum(["FULL", "HALF"]).default("HALF"),
  style: z.object({
    artStyle: z.enum(ART_STYLES),
    version: z.enum(VERSION_OPTIONS).default("default"),
    promptType: z.enum(PROMPT_TYPE_OPTIONS).default("default"),
    prompt: z.string().nullable().optional(),
    model: z.enum(MODEL_OPTIONS).default("default"),
  }),
  assets: z.object({
    video_source: z.literal("file"),
    video_file_path: z.string().min(1, "Video file path is required"),
  }),
  name: z.string().optional(),
});

// Union schema that handles all three modes
export const videoGeneratorConfigSchema = z.union([
  textToVideoConfigSchema,
  imageToVideoConfigSchema,
  videoToVideoConfigSchema,
]);

// Node config schema for config store (includes all possible fields)
export const videoGeneratorNodeConfigSchema = z.object({
  mode: z.enum(VIDEO_GENERATION_MODES).default("text-to-video"),
  endSeconds: z.number().min(5).max(60).default(5),
  startSeconds: z.number().min(0).default(0),
  resolution: z.enum(RESOLUTIONS).default("720p"),
  orientation: z.enum(ORIENTATION_OPTIONS).default("square"),
  prompt: z.string().default(""),
  imageFilePath: z.string().optional(),
  fpsResolution: z.enum(["FULL", "HALF"]).default("HALF"),
  artStyle: z.enum(ART_STYLES).default("Pixel"),
  version: z.enum(VERSION_OPTIONS).default("default"),
  promptType: z.enum(PROMPT_TYPE_OPTIONS).default("default"),
  model: z.enum(MODEL_OPTIONS).default("default"),
  name: z.string().optional(),
});

// Zod schema for Video Generator node data
export const videoGeneratorNodeDataSchema = z.object({
  config: videoGeneratorConfigSchema.optional(),
});

// Infer the TypeScript types from the schemas
export type VideoGeneratorConfig = z.infer<typeof videoGeneratorConfigSchema>;
export type VideoGeneratorNodeConfig = z.infer<
  typeof videoGeneratorNodeConfigSchema
>;
export type VideoGeneratorNodeData = z.infer<
  typeof videoGeneratorNodeDataSchema
>;

// Export enum types for use in other files
export type ArtStyle = (typeof ART_STYLES)[number];
export type Version = (typeof VERSION_OPTIONS)[number];
export type PromptType = (typeof PROMPT_TYPE_OPTIONS)[number];
export type ModelOption = (typeof MODEL_OPTIONS)[number];
export type Orientation = (typeof ORIENTATION_OPTIONS)[number];

// Validation functions for config
export const validateVideoGeneratorConfig = (
  data: unknown
): VideoGeneratorConfig => {
  return videoGeneratorConfigSchema.parse(data);
};

export const safeValidateVideoGeneratorConfig = (data: unknown) => {
  return videoGeneratorConfigSchema.safeParse(data);
};

// Validation functions for node data
export const validateVideoGeneratorNodeData = (
  data: unknown
): VideoGeneratorNodeData => {
  return videoGeneratorNodeDataSchema.parse(data);
};

export const safeValidateVideoGeneratorNodeData = (data: unknown) => {
  return videoGeneratorNodeDataSchema.safeParse(data);
};
