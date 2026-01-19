type SelectItem = {
  value: string;
  label: string;
};

export const FACE_SWAP_MODE_OPTIONS: SelectItem[] = [
  { value: "all-faces", label: "All Faces" },
  { value: "individual-faces", label: "Individual Faces" },
];

export const VERSION_OPTIONS: SelectItem[] = [
  { value: "default", label: "Default (Recommended)" },
  { value: "v2", label: "V2 (Faster, Sharper)" },
  { value: "v1", label: "V1 (Better Texture)" },
];

export const VIDEO_SOURCE_OPTIONS: SelectItem[] = [
  { value: "file", label: "File Upload" },
  { value: "youtube", label: "YouTube URL" },
];

export const TRIM_CONFIG = {
  startSeconds: { min: 0, max: 300, step: 1 },
  endSeconds: { min: 0, max: 300, step: 1 },
};
