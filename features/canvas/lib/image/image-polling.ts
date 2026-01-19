import { getImageDetails } from "../../services/image";

export type ImageStatus =
  | "draft"
  | "queued"
  | "rendering"
  | "complete"
  | "error"
  | "canceled";

export type ImageDetails = {
  id: string;
  name: string | null;
  status: ImageStatus;
  image_count: number;
  type: string;
  created_at: string;
  enabled: boolean;
  total_frame_cost: number;
  credits_charged: number;
  downloads: Array<{
    url: string;
    expires_at: string;
  }>;
  error: null | { message: string };
};

type PollingOptions = {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
};

export const pollImageStatus = async (
  imageId: string,
  onStatusChange?: (status: ImageStatus) => void,
  options: PollingOptions = {}
): Promise<ImageDetails> => {
  const {
    maxAttempts = 360, // 30 minutes with backoff
    initialDelayMs = 1000, // 1 second
    maxDelayMs = 5000, // 5 seconds
  } = options;

  let attempts = 0;
  let delayMs = initialDelayMs;

  while (attempts < maxAttempts) {
    try {
      const details = await getImageDetails(imageId);

      if (onStatusChange) {
        onStatusChange(details.status);
      }

      // Check if generation is complete
      if (details.status === "complete") {
        return details;
      }

      // Check if there was an error
      if (details.status === "error" || details.status === "canceled") {
        throw new Error(
          details.error?.message || `Image generation ${details.status}`
        );
      }

      // Still rendering, wait and retry
      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      // Increase delay over time (exponential backoff)
      delayMs = Math.min(delayMs * 1.2, maxDelayMs);
    } catch (error) {
      throw error;
    }
  }

  throw new Error("Image generation polling timeout");
};
