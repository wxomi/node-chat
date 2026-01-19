type SelectItem = {
  value: string;
  label: string;
  description?: string;
};

export const FACE_SWAP_MODE_OPTIONS: SelectItem[] = [
  {
    value: "all-faces",
    label: "All Faces",
    description: "Swap all faces in the image with the source face.",
  },
  {
    value: "individual-faces",
    label: "Individual Faces",
    description: "Select and swap individual faces one at a time.",
  },
];

export const IMAGE_SOURCE_OPTIONS: SelectItem[] = [
  { value: "file", label: "Image Upload" },
  { value: "youtube", label: "YouTube URL" },
];
