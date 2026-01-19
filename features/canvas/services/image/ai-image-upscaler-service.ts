import { AIImageUpscalerConfig } from "../../validations/image";
import { useApiCall } from "../../hooks/use-api-call";

type UpscaleImageResponse = {
  id: string;
  frame_cost: number;
  credits_charged: number;
};

export const upscaleImage = async (
  config: AIImageUpscalerConfig
): Promise<UpscaleImageResponse> => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: "https://api.magichour.ai/v1/ai-image-upscaler",
    method: "POST",
    data: {
      name: config.name || `Image Upscaler - ${new Date().toISOString()}`,
      scale_factor: parseInt(config.scaleFactor),
      style: {
        enhancement: config.enhancement,
        ...(config.prompt && { prompt: config.prompt }),
      },
      assets: {
        image_file_path: config.imageFilePath,
      },
    },
  });
};

export const getImageDetails = async (imageId: string) => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: `https://api.magichour.ai/v1/image-projects/${imageId}`,
    method: "GET",
  });
};
