import { useApiCall } from "../../hooks/use-api-call";
import { AnimationConfig } from "../../validations/video";

type GenerateAnimationResponse = {
  id: string;
  estimated_frame_cost: number;
  credits_charged: number;
};

// Helper to remove undefined/null values
const cleanPayload = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj
      .map(cleanPayload)
      .filter((item) => item !== null && item !== undefined);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined) {
        acc[key] = cleanPayload(value);
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

export const generateAnimation = async (
  config: AnimationConfig
): Promise<GenerateAnimationResponse> => {
  const { executeApiCall } = useApiCall();

  const payload = {
    name: config.name || `Animation - ${new Date().toISOString()}`,
    fps: config.fps,
    end_seconds: config.endSeconds,
    height: config.height,
    width: config.width,
    style: {
      art_style: config.style.artStyle,
      ...(config.style.artStyleCustom && {
        art_style_custom: config.style.artStyleCustom,
      }),
      camera_effect: config.style.cameraEffect,
      prompt_type: config.style.promptType,
      ...(config.style.prompt && { prompt: config.style.prompt }),
      transition_speed: config.style.transitionSpeed,
    },
    assets: {
      audio_source: config.assets.audioSource,
      ...(config.assets.audioFilePath && {
        audio_file_path: config.assets.audioFilePath,
      }),
      ...(config.assets.youtubeUrl && {
        youtube_url: config.assets.youtubeUrl,
      }),
      ...(config.assets.imageFilePath && {
        image_file_path: config.assets.imageFilePath,
      }),
    },
  };

  const cleanedPayload = cleanPayload(payload);

  return executeApiCall({
    endpoint: "https://api.magichour.ai/v1/animation",
    method: "POST",
    data: cleanedPayload,
  });
};

export const getVideoDetails = async (videoId: string) => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: `https://api.magichour.ai/v1/video-projects/${videoId}`,
    method: "GET",
  });
};
