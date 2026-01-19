import { FaceSwapConfig } from "../../validations/image";
import { FaceMapping } from "../../validations/shared";
import { useApiCall } from "../../hooks/use-api-call";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.magichour.ai";

type FaceSwapResponse = {
  id: string;
  frame_cost: number;
  credits_charged: number;
};

type FaceDetectionResponse = {
  id: string;
  credits_charged: number;
  status: "queued" | "rendering" | "complete" | "error";
  faces: Array<{
    path: string;
    url: string;
  }>;
};

export const faceSwap = async (config: FaceSwapConfig): Promise<string> => {
  const { executeApiCall } = useApiCall();

  const requestBody: Record<string, any> = {
    name: config.name || "Face Swap image",
    assets: {
      face_swap_mode: config.faceSwapMode,
      target_file_path: config.targetFilePath,
    },
  };

  if (config.faceSwapMode === "all-faces") {
    requestBody.assets.source_file_path = config.sourceFilePath;
  } else if (config.faceSwapMode === "individual-faces") {
    requestBody.assets.face_mappings = config.faceMappings;
  }

  console.log("[faceSwap] Sending request to face-swap-photo endpoint", {
    endpoint: `${API_BASE_URL}/v1/face-swap-photo`,
    requestBody,
  });

  try {
    const data: FaceSwapResponse = await executeApiCall({
      endpoint: `${API_BASE_URL}/v1/face-swap-photo`,
      method: "POST",
      data: requestBody,
    });

    console.log("[faceSwap] API Response received", {
      response: data,
      responseId: data.id,
      framesCost: data.frame_cost,
      creditsCharged: data.credits_charged,
    });

    return data.id;
  } catch (error) {
    console.error("[faceSwap] API call failed with error", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorDetails: error,
    });
    throw error;
  }
};

export const detectFaces = async (imageId: string): Promise<FaceMapping[]> => {
  const { executeApiCall } = useApiCall();

  const data: FaceDetectionResponse = await executeApiCall({
    endpoint: `${API_BASE_URL}/v1/face-detection/${imageId}`,
    method: "GET",
  });

  if (data.status === "queued" || data.status === "rendering") {
    return [];
  }

  if (data.status === "error") {
    throw new Error("Face detection failed");
  }

  return [];
};
