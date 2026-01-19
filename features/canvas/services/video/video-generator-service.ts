import { VideoGeneratorConfig } from "../../validations/video";
import { useApiCall } from "../../hooks/use-api-call";
import { VideoDetails } from "../../lib/video";

type GenerateVideoResponse = {
  id: string;
  estimated_frame_cost: number;
  credits_charged: number;
};

export const generateTextToVideo = async (
  config: Extract<VideoGeneratorConfig, { mode: "text-to-video" }>
): Promise<GenerateVideoResponse> => {
  const { executeApiCall } = useApiCall();

  const payload = {
    name: config.name || `Text-to-Video - ${new Date().toISOString()}`,
    end_seconds: config.endSeconds,
    orientation: config.orientation,
    resolution: config.resolution,
    style: {
      prompt: config.prompt,
    },
  };

  return executeApiCall({
    endpoint: "https://api.magichour.ai/v1/text-to-video",
    method: "POST",
    data: payload,
  });
};

export const generateImageToVideo = async (
  config: Extract<VideoGeneratorConfig, { mode: "image-to-video" }>
): Promise<GenerateVideoResponse> => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: "https://api.magichour.ai/v1/image-to-video",
    method: "POST",
    data: {
      name: config.name || `Image-to-Video - ${new Date().toISOString()}`,
      end_seconds: config.endSeconds,
      resolution: config.resolution,
      style: {
        prompt: config.imageFilePath,
      },
      assets: {
        image_file_path: config.imageFilePath,
      },
    },
  });
};

export const generateVideoToVideo = async (
  config: Extract<VideoGeneratorConfig, { mode: "video-to-video" }>
): Promise<GenerateVideoResponse> => {
  const { executeApiCall } = useApiCall();

  const payload = {
    name: config.name || `Video-to-Video - ${new Date().toISOString()}`,
    start_seconds: config.startSeconds,
    end_seconds: config.endSeconds,
    fps_resolution: config.fpsResolution,
    style: {
      art_style: config.style.artStyle,
      version: config.style.version,
      prompt_type: config.style.promptType,
      prompt: config.style.prompt || null,
      model: config.style.model,
    },
    assets: {
      video_source: config.assets.video_source,
      video_file_path: config.assets.video_file_path,
    },
  };

  return executeApiCall({
    endpoint: "https://api.magichour.ai/v1/video-to-video",
    method: "POST",
    data: payload,
  });
};

export const getVideoDetails = async (
  videoId: string
): Promise<VideoDetails> => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: `https://api.magichour.ai/v1/video-projects/${videoId}`,
    method: "GET",
  });
};
