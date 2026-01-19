import { useApiCall } from "../../hooks/use-api-call";
import { FaceSwapVideoConfig } from "../../validations/video";

type GenerateVideoResponse = {
  id: string;
  estimated_frame_cost: number;
  credits_charged: number;
};

export const generateFaceSwapVideo = async (
  config: FaceSwapVideoConfig
): Promise<GenerateVideoResponse> => {
  const { executeApiCall } = useApiCall();

  const payload: any = {
    name: config.name || `Face Swap Video - ${new Date().toISOString()}`,
    start_seconds: config.startSeconds,
    end_seconds: config.endSeconds,
    style: {
      version: config.style.version,
    },
    assets: {
      face_swap_mode: config.assets.faceSwapMode,
      video_source: config.assets.videoSource,
    },
  };

  // Add mode-specific fields
  if (
    config.assets.faceSwapMode === "all-faces" &&
    config.assets.imageFilePath
  ) {
    payload.assets.image_file_path = config.assets.imageFilePath;
  } else if (
    config.assets.faceSwapMode === "individual-faces" &&
    config.assets.faceMappings
  ) {
    payload.assets.face_mappings = config.assets.faceMappings;
  }

  // Add video source fields
  if (config.assets.videoSource === "file" && config.assets.videoFilePath) {
    payload.assets.video_file_path = config.assets.videoFilePath;
  } else if (
    config.assets.videoSource === "youtube" &&
    config.assets.youtubeUrl
  ) {
    payload.assets.youtube_url = config.assets.youtubeUrl;
  }

  console.log("[generateFaceSwapVideo] Sending request to face-swap endpoint", {
    endpoint: "https://api.magichour.ai/v1/face-swap",
    payload,
  });

  try {
    const response: GenerateVideoResponse = await executeApiCall({
      endpoint: "https://api.magichour.ai/v1/face-swap",
      method: "POST",
      data: payload,
    });

    console.log("[generateFaceSwapVideo] API Response received", {
      response,
      responseId: response.id,
      estimatedFrameCost: response.estimated_frame_cost,
      creditsCharged: response.credits_charged,
    });

    return response;
  } catch (error) {
    console.error("[generateFaceSwapVideo] API call failed with error", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorDetails: error,
    });
    throw error;
  }
};

export const getVideoDetails = async (videoId: string) => {
  const { executeApiCall } = useApiCall();

  console.log("[getVideoDetails] Fetching video details", {
    endpoint: `https://api.magichour.ai/v1/video-projects/${videoId}`,
    videoId,
  });

  try {
    const response = await executeApiCall({
      endpoint: `https://api.magichour.ai/v1/video-projects/${videoId}`,
      method: "GET",
    });

    console.log("[getVideoDetails] API Response received", {
      response,
      status: (response as any)?.status,
    });

    return response;
  } catch (error) {
    console.error("[getVideoDetails] API call failed with error", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorDetails: error,
      videoId,
    });
    throw error;
  }
};
