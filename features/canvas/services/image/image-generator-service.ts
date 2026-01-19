import { ImageGeneratorConfig } from "../../validations/image";
import { useApiCall } from "../../hooks/use-api-call";
import { ImageDetails } from "../../lib/image";

type GenerateImageResponse = {
  id: string;
  frame_cost: number;
  credits_charged: number;
};

export const generateImage = async (
  config: ImageGeneratorConfig
): Promise<GenerateImageResponse> => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: "https://api.magichour.ai/v1/ai-image-generator",
    method: "POST",
    data: {
      name: config.name || `AI Image - ${new Date().toISOString()}`,
      image_count: config.imageCount,
      orientation: config.orientation,
      style: config.style,
    },
  });
};

export const getImageDetails = async (
  imageId: string
): Promise<ImageDetails> => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: `https://api.magichour.ai/v1/image-projects/${imageId}`,
    method: "GET",
  });
};
