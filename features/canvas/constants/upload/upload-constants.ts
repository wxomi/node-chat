import { ImageIcon, VideoIcon, MusicIcon } from "@/constants/icons";

// Valid extensions per asset type (from Magic Hour API)
export const VALID_EXTENSIONS = {
  image: ["png", "jpg", "jpeg", "webp", "avif", "jp2", "tiff", "bmp"],
  video: ["mp4", "m4v", "mov", "webm"],
  audio: ["mp3", "mpeg", "wav", "aac", "aiff", "flac"],
} as const satisfies Record<"image" | "video" | "audio", readonly string[]>;

// Icon configuration constants
export const ICON_CONFIG = {
  image: {
    key: "image-icon",
    icon: ImageIcon,
    alt: "Image",
  },
  video: {
    key: "video-icon",
    icon: VideoIcon,
    alt: "Video",
  },
  audio: {
    key: "audio-icon",
    icon: MusicIcon,
    alt: "Audio",
  },
  import: {
    key: "import-icon",
    icon: null, // Will use ImportIcon component
    alt: "Import",
  },
  default: {
    key: "default-icon",
    icon: null, // Will use ImportIcon component
    alt: "Import",
  },
} as const;

// MIME type to extension mapping for drag detection
export const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/tiff": "tiff",
  "image/bmp": "bmp",
  "image/jp2": "jp2",
  "video/mp4": "mp4",
  "video/m4v": "m4v",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "audio/mp3": "mp3",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/aac": "aac",
  "audio/aiff": "aiff",
  "audio/flac": "flac",
};

// Supported file type display names and their extensions
export const FILE_TYPE_INFO = {
  image: {
    displayName: "Images",
    extensions: "PNG, JPG, JPEG, WebP, AVIF, JP2, TIFF, BMP",
  },
  video: {
    displayName: "Videos",
    extensions: "MP4, M4V, MOV, WebM",
  },
  audio: {
    displayName: "Audio",
    extensions: "MP3, MPEG, WAV, AAC, AIFF, FLAC",
  },
} as const;
