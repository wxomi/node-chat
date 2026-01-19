import { getVideoDetails } from "../../services/video";

export type VideoStatus =
  | "draft"
  | "queued"
  | "rendering"
  | "complete"
  | "error"
  | "canceled";

export type VideoDetails = {
  id: string;
  name: string | null;
  status: VideoStatus;
  type: string;
  created_at: string;
  enabled: boolean;
  credits_charged: number;
  fps: number;
  downloads: Array<{
    url: string;
    expires_at: string;
  }>;
  error: null | { message: string; code: string };
};

type PollingOptions = {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
};

export const pollVideoStatus = async (
  videoId: string,
  onStatusChange?: (status: VideoStatus) => void,
  options: PollingOptions = {}
): Promise<VideoDetails> => {
  const {
    maxAttempts = 360, // 30 minutes with backoff
    initialDelayMs = 1000,
    maxDelayMs = 5000,
  } = options;

  let attempts = 0;
  let delayMs = initialDelayMs;

  while (attempts < maxAttempts) {
    try {
      const details = await getVideoDetails(videoId);

      if (onStatusChange) {
        onStatusChange(details.status);
      }

      if (details.status === "complete") {
        return details;
      }

      if (details.status === "error" || details.status === "canceled") {
        throw new Error(
          details.error?.message || `Video generation ${details.status}`
        );
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      delayMs = Math.min(delayMs * 1.2, maxDelayMs);
    } catch (error) {
      throw error;
    }
  }

  throw new Error("Video generation polling timeout");
};
