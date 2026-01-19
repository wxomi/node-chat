/**
 * YouTube URL validation utilities
 * Validates YouTube URLs including regular videos, Shorts, embedded videos, and shortened URLs
 */

// YouTube URL regex pattern
// Matches: watch?v=, shorts/, embed/, youtu.be/
// Capturing groups: [1] = watch video ID, [2] = shorts video ID, [3] = embed video ID, [4] = youtu.be video ID
export const YOUTUBE_URL_REGEX =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:(?:watch\?(?:.*?&)?v=([\w-]{11})|shorts\/([\w-]{11}))|embed\/([\w-]{11}))|youtu\.be\/([\w-]{11}))(?:(?:[^\s]*))?$/;

export type YouTubeUrlValidationResult = {
  isValid: boolean;
  isShorts: boolean;
  videoId: string | null;
};

/**
 * Validates a YouTube URL and detects if it's a Shorts video
 * @param url - The YouTube URL to validate
 * @returns Validation result with isValid, isShorts, and videoId
 */
export function validateYouTubeUrl(url: string): YouTubeUrlValidationResult {
  if (!url || !url.trim()) {
    return { isValid: false, isShorts: false, videoId: null };
  }

  const trimmedUrl = url.trim();
  const match = trimmedUrl.match(YOUTUBE_URL_REGEX);

  if (!match) {
    return { isValid: false, isShorts: false, videoId: null };
  }

  // Group 2 is for Shorts, groups 1/3/4 are for regular videos
  const isShorts = !!match[2]; // Shorts URL matched
  const videoId =
    match[1] || // watch?v=VIDEO_ID
    match[2] || // shorts/VIDEO_ID
    match[3] || // embed/VIDEO_ID
    match[4] || // youtu.be/VIDEO_ID
    null;

  return {
    isValid: true,
    isShorts,
    videoId,
  };
}

/**
 * Zod custom refinement for YouTube URL validation
 * Can be used with z.string().refine()
 */
export function youtubeUrlRefinement(url: string): boolean {
  return validateYouTubeUrl(url).isValid;
}
