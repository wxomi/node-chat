import { AIImageEditorConfig } from "../../validations/image";
import { useApiCall } from "../../hooks/use-api-call";

type EditImageResponse = {
  id: string;
  frame_cost: number;
  credits_charged: number;
};

export const editImage = async (
  config: AIImageEditorConfig
): Promise<EditImageResponse> => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: "https://api.magichour.ai/v1/ai-image-editor",
    method: "POST",
    data: {
      name: config.name || `AI Image Editor - ${new Date().toISOString()}`,
      style: {
        prompt: config.prompt,
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
