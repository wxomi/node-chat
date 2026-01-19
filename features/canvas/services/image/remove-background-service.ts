import { RemoveBackgroundConfig } from "../../validations/image";
import { useApiCall } from "../../hooks/use-api-call";

type RemoveBackgroundResponse = {
  id: string;
  frame_cost: number;
  credits_charged: number;
};

export const removeBackground = async (
  config: RemoveBackgroundConfig
): Promise<RemoveBackgroundResponse> => {
  const { executeApiCall } = useApiCall();

  return executeApiCall({
    endpoint: "https://api.magichour.ai/v1/image-background-remover",
    method: "POST",
    data: {
      name: config.name || `Remove Background - ${new Date().toISOString()}`,
      assets: {
        image_file_path: config.imageFilePath,
        ...(config.backgroundImageFilePath && {
          background_image_file_path: config.backgroundImageFilePath,
        }),
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
