import { useApiCall } from "../../hooks/use-api-call";
import { LipSyncConfig } from "../../validations/video";

type GenerateVideoResponse = {
  id: string;
  estimated_frame_cost: number;
  credits_charged: number;
};

export const generateLipSync = async (
  config: LipSyncConfig
): Promise<GenerateVideoResponse> => {
  const { executeApiCall } = useApiCall();

  const payload: any = {
    name: config.name || `Lip Sync - ${new Date().toISOString()}`,
    start_seconds: config.startSeconds,
    end_seconds: config.endSeconds,
    max_fps_limit: config.maxFpsLimit,
    style: {
      generation_mode: config.style.generationMode,
    },
    assets: {
      audio_file_path: config.assets.audioFilePath,
      video_source: config.assets.videoSource,
    },
  };

  // Add video source fields
  if (config.assets.videoSource === "file" && config.assets.videoFilePath) {
    payload.assets.video_file_path = config.assets.videoFilePath;
  } else if (
    config.assets.videoSource === "youtube" &&
    config.assets.youtubeUrl
  ) {
    payload.assets.youtube_url = config.assets.youtubeUrl;
  }

  return executeApiCall({
    endpoint: "https://api.magichour.ai/v1/lip-sync",
    method: "POST",
    data: payload,
  });
};

export const getVideoDetails = async (videoId: string) => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: `https://api.magichour.ai/v1/video-projects/${videoId}`,
    method: "GET",
  });
};
