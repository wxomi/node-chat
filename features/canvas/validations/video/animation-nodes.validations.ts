import { z } from "zod";

// Enums based on API docs
export const ANIMATION_ART_STYLES = [
  "Custom",
  "Painterly Illustration",
  "Vibrant Matte Illustration",
  "Traditional Watercolor",
  "Cyberpunk",
  "Ink and Watercolor Portrait",
  "Intricate Abstract Lines Portrait",
  "3D Render",
  "Old School Comic",
  "Bold Colored Illustration",
  "Synthwave",
  "Minimal Cold Futurism",
  "Futuristic Anime",
  "Cinematic Miyazaki",
  "Studio Ghibli Film Still",
  "Soft Delicate Matte Portrait",
  "Cinematic Landscape",
  "Landscape Painting",
  "Photograph",
  "Jackson Pollock",
  "Cubist",
  "Abstract Minimalist",
  "Impressionism",
  "Van Gogh",
  "Woodcut",
  "Oil Painting",
  "Vintage Japanese Anime",
  "Pixar",
  "Cosmic",
  "Pixel Art",
  "Fantasy",
  "Arcane",
  "Sin City",
  "Double Exposure",
  "Painted Cityscape",
  "90s Streets",
  "Overgrown",
  "Postapocalyptic",
  "Spooky",
  "Miniatures",
  "Low Poly",
  "Art Deco",
  "Inkpunk",
  "Dark Graphic Illustration",
  "Dark Watercolor",
  "Faded Illustration",
  "Directed by AI",
] as const;

export const ANIMATION_CAMERA_EFFECTS = [
  "Simple Zoom Out",
  "Simple Zoom In",
  "Bounce Out",
  "Spin Bounce",
  "Rolling Bounces",
  "Rise and Climb",
  "Dramatic Zoom In",
  "Dramatic Zoom Out",
  "Sway Out",
  "Boost Zoom In",
  "Boost Zoom Out",
  "Heartbeat",
  "Bounce in Place",
  "Earthquake Bounce",
  "Slice Bounce",
  "Bounce In And Out",
  "Jump",
  "Road Trip",
  "Traverse",
  "Rubber Band",
  "Rodeo",
  "Accelerate",
  "Speed of Light",
  "Drift Spin",
  "Vertigo",
  "Cog in the Machine",
  "Quadrant",
  "Tron",
  "Pusher",
  "Roll In",
  "Hesitate In",
  "Zoom In - Audio Sync",
  "Pulse - Audio Sync",
  "Aggressive Zoom In - Audio Sync",
  "Roll In - Audio Sync",
  "Zoom Out - Audio Sync",
  "Aggressive Zoom Out - Audio Sync",
  "Sway Out - Audio Sync",
  "Bounce and Spin - Audio Sync",
  "Zoom In and Spin - Audio Sync",
  "Vertigo - Audio Sync",
  "Bounce Out - Audio Sync",
  "Earthquake Bounce - Audio Sync",
  "Pusher - Audio Sync",
  "Evolve - Audio Sync",
  "Devolve - Audio Sync",
  "Slideshow",
  "Pan Left",
  "Pan Right",
  "Tilt Up",
  "Tilt Down",
  "Directed by AI",
] as const;

export const ANIMATION_PROMPT_TYPES = [
  "custom",
  "use_lyrics",
  "ai_choose",
] as const;

export const ANIMATION_AUDIO_SOURCES = ["none", "file", "youtube"] as const;

// Helper function to validate YouTube URLs
const isValidYouTubeUrl = (url: string): boolean => {
  return url.toLowerCase().includes("youtube");
};

// API config schema
export const animationConfigSchema = z
  .object({
    name: z.string().optional(),
    fps: z.number().min(1),
    endSeconds: z.number().min(0.1),
    width: z.literal(512),
    height: z.literal(960),
    style: z
      .object({
        artStyle: z.enum(ANIMATION_ART_STYLES),
        artStyleCustom: z.string().optional(),
        cameraEffect: z.enum(ANIMATION_CAMERA_EFFECTS),
        promptType: z.enum(ANIMATION_PROMPT_TYPES),
        prompt: z.string().optional(),
        transitionSpeed: z.number().int().min(1).max(10),
      })
      .refine(
        (data) => {
          if (data.artStyle === "Custom") {
            return (
              !!data.artStyleCustom && data.artStyleCustom.trim().length > 0
            );
          }
          return true;
        },
        {
          message: "Please describe the custom art style",
          path: ["artStyleCustom"],
        }
      )
      .refine(
        (data) => {
          if (data.promptType === "custom") {
            return !!data.prompt && data.prompt.trim().length > 0;
          }
          return true;
        },
        {
          message: "Please add a prompt for the animation",
          path: ["prompt"],
        }
      ),
    assets: z.object({
      audioSource: z.enum(ANIMATION_AUDIO_SOURCES),
      audioFilePath: z.string().optional(),
      youtubeUrl: z
        .string()
        .url("Invalid URL")
        .refine((url) => {
          const urlObj = new URL(url);
          return (
            urlObj.hostname.includes("youtube.com") ||
            urlObj.hostname.includes("youtu.be")
          );
        }, "Must be a valid YouTube URL")
        .optional(),
      imageFilePath: z.string().optional(),
    }),
  })
  .refine(
    (data) => {
      // If file, require audioFilePath
      if (data.assets.audioSource === "file") {
        return (
          !!data.assets.audioFilePath &&
          data.assets.audioFilePath.trim().length > 0
        );
      }
      return true;
    },
    {
      message: "Please connect an audio file or change the audio source mode",
      path: ["assets", "audioFilePath"],
    }
  )
  .refine(
    (data) => {
      // If youtube, require youtubeUrl
      if (data.assets.audioSource === "youtube") {
        return (
          !!data.assets.youtubeUrl && data.assets.youtubeUrl.trim().length > 0
        );
      }
      return true;
    },
    {
      message:
        "Please add a YouTube URL for the audio or change the audio source mode",
      path: ["assets", "youtubeUrl"],
    }
  )
  .refine(
    (data) => {
      // If youtube, validate the URL format
      if (data.assets.audioSource === "youtube" && data.assets.youtubeUrl) {
        return isValidYouTubeUrl(data.assets.youtubeUrl);
      }
      return true;
    },
    {
      message: "Please enter a valid YouTube URL (youtube.com or youtu.be)",
      path: ["assets", "youtubeUrl"],
    }
  )
  .refine(
    (data) => {
      // If promptType is use_lyrics or ai_choose, audioSource must be file or youtube
      if (
        data.style.promptType === "use_lyrics" ||
        data.style.promptType === "ai_choose"
      ) {
        return (
          data.assets.audioSource === "file" ||
          data.assets.audioSource === "youtube"
        );
      }
      return true;
    },
    {
      message:
        "Please add audio (file or YouTube) when using 'Use Lyrics' or 'AI Choose' mode. Switch to 'Custom' prompt type for no audio.",
      path: ["assets", "audioSource"],
    }
  );

// Node config schema (stored in config store)
export const animationNodeConfigSchema = z.object({
  name: z.string().optional(),
  fps: z.number().min(1).default(12),
  endSeconds: z.number().min(0.1).default(15),
  width: z.number().default(512),
  height: z.number().default(960),
  orientation: z.enum(["square", "landscape", "portrait"]).default("square"),
  style: z.object({
    artStyle: z.enum(ANIMATION_ART_STYLES).default("Painterly Illustration"),
    artStyleCustom: z.string().optional(),
    cameraEffect: z.enum(ANIMATION_CAMERA_EFFECTS).default("Simple Zoom In"),
    promptType: z.enum(ANIMATION_PROMPT_TYPES).default("custom"),
    prompt: z.string().default(""),
    transitionSpeed: z.number().int().min(1).max(10).default(5),
  }),
  assets: z.object({
    audioSource: z.enum(ANIMATION_AUDIO_SOURCES).default("file"),
    audioFilePath: z.string().optional(),
    youtubeUrl: z.string().optional(),
    imageFilePath: z.string().optional(),
  }),
});

export type AnimationConfig = z.infer<typeof animationConfigSchema>;
export type AnimationNodeConfig = z.infer<typeof animationNodeConfigSchema>;

export const validateAnimationConfig = (data: unknown): AnimationConfig => {
  return animationConfigSchema.parse(data);
};

export const safeValidateAnimationConfig = (data: unknown) => {
  return animationConfigSchema.safeParse(data);
};
