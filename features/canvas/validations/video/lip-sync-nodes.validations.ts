import { z } from "zod";
import { youtubeUrlRefinement } from "../shared/youtube-url.validation";

const GENERATION_MODES = ["lite", "standard", "pro"] as const;
const VIDEO_SOURCES = ["file", "youtube"] as const;

export const lipSyncConfigSchema = z
  .object({
    name: z.string().optional(),
    startSeconds: z.number().min(0),
    endSeconds: z.number().min(0.1),
    maxFpsLimit: z.number().min(1),
    style: z.object({
      generationMode: z.enum(GENERATION_MODES).default("lite"),
    }),
    assets: z.object({
      audioFilePath: z.string().min(1, "Audio file path is required"),
      videoSource: z.enum(VIDEO_SOURCES),
      videoFilePath: z.string().optional(),
      youtubeUrl: z
        .url("Invalid URL")
        .refine(youtubeUrlRefinement, {
          message: "Must be a valid YouTube URL",
        })
        .optional(),
    }),
  })
  .refine(
    (data) => {
      if (data.assets.videoSource === "file") {
        return (
          !!data.assets.videoFilePath &&
          data.assets.videoFilePath.trim().length > 0
        );
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
        return (
          !!data.assets.youtubeUrl && data.assets.youtubeUrl.trim().length > 0
        );
      }
      return true;
    },
    {
      message: "YouTube URL is required when video source is youtube",
      path: ["assets", "youtubeUrl"],
    }
  )
  .refine((data) => data.endSeconds > data.startSeconds, {
    message: "End time must be greater than start time",
    path: ["endSeconds"],
  });

export const lipSyncNodeConfigSchema = z.object({
  name: z.string().optional(),
  startSeconds: z.number().min(0).default(0),
  endSeconds: z.number().min(0.1).default(15),
  maxFpsLimit: z.number().min(1).default(12),
  orientation: z.enum(["square", "landscape", "portrait"]).default("square"),
  style: z.object({
    generationMode: z.enum(GENERATION_MODES).default("lite"),
  }),
  assets: z.object({
    videoSource: z.enum(VIDEO_SOURCES).default("file"),
    youtubeUrl: z.string().optional(),
  }),
});

export type LipSyncConfig = z.infer<typeof lipSyncConfigSchema>;
export type LipSyncNodeConfig = z.infer<typeof lipSyncNodeConfigSchema>;
