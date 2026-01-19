type MenuOption = {
  id: string;
  label: string;
  chartColor: "chart-1" | "chart-2" | "chart-3" | "chart-5";
};

// Map menu option IDs to video generation modes
export const MENU_OPTION_TO_MODE_MAP: Record<
  string,
  "image-to-video" | "video-to-video" | "text-to-video"
> = {
  prompt: "text-to-video",
  image: "image-to-video",
  video: "video-to-video",
};

// Menu options for video generator mode switcher
export const VIDEO_GENERATOR_MENU_OPTIONS: MenuOption[] = [
  { id: "prompt", label: "Prompt", chartColor: "chart-1" },
  { id: "image", label: "Image", chartColor: "chart-2" },
  { id: "video", label: "Video", chartColor: "chart-5" },
];

// Reverse mapping: mode to menu option ID
export const MODE_TO_MENU_OPTION_MAP: Record<
  "image-to-video" | "video-to-video" | "text-to-video",
  string
> = {
  "text-to-video": "prompt",
  "image-to-video": "image",
  "video-to-video": "video",
};

// Map menu option IDs to handle IDs
export const MENU_OPTION_TO_HANDLE_MAP: Record<string, string> = {
  prompt: "prompt-input",
  image: "image-input",
  video: "video-input",
};
