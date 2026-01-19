type NodeHandle = {
  id: string;
  label: string;
  dataType: "string" | "image" | "video" | "audio";
  required?: boolean;
};

type NodeDescriptionConfig = {
  description: string;
  inputs: NodeHandle[];
  outputs: NodeHandle[];
};

export const NODE_DESCRIPTIONS_CONFIG: Record<string, NodeDescriptionConfig> = {
  // Prompt nodes
  "text-node": {
    description: "Enter text prompts for processing",
    inputs: [],
    outputs: [
      {
        id: "prompt-output",
        label: "Prompt",
        dataType: "string",
        required: true,
      },
    ],
  },
  "prompt-enhancer-node": {
    description: "Improve text prompts with AI",
    inputs: [
      {
        id: "prompt-input",
        label: "Prompt",
        dataType: "string",
        required: true,
      },
    ],
    outputs: [
      {
        id: "enhanced-prompt-output",
        label: "Prompt",
        dataType: "string",
      },
    ],
  },

  // Image nodes
  "upload-node": {
    description: "Upload images, videos, or audio files",
    inputs: [],
    outputs: [],
  },
  "image-generator-node": {
    description: "Create new images from text prompts",
    inputs: [
      {
        id: "prompt-input",
        label: "Prompt",
        dataType: "string",
      },
    ],
    outputs: [
      {
        id: "image-output",
        label: "Image",
        dataType: "image",
      },
    ],
  },
  "ai-image-editor-node": {
    description: "Edit images with AI using prompts",
    inputs: [
      {
        id: "image-input",
        label: "Image",
        dataType: "image",
        required: true,
      },
      {
        id: "prompt-input",
        label: "Prompt",
        dataType: "string",
        required: true,
      },
    ],
    outputs: [
      {
        id: "image-output",
        label: "Image",
        dataType: "image",
      },
    ],
  },
  "ai-image-upscaler-node": {
    description: "Enlarge images without losing quality",
    inputs: [
      {
        id: "image-input",
        label: "Image",
        dataType: "image",
        required: true,
      },
    ],
    outputs: [
      {
        id: "image-output",
        label: "Image",
        dataType: "image",
      },
    ],
  },
  "remove-background-node": {
    description: "Remove image backgrounds automatically",
    inputs: [
      {
        id: "image-input",
        label: "Image",
        dataType: "image",
        required: true,
      },
    ],
    outputs: [
      {
        id: "image-output",
        label: "Image",
        dataType: "image",
      },
    ],
  },
  "face-swap-node": {
    description: "Swap faces between two images",
    inputs: [
      {
        id: "source-face-input",
        label: "Image",
        dataType: "image",
        required: true,
      },
      {
        id: "target-face-input",
        label: "Image",
        dataType: "image",
        required: true,
      },
    ],
    outputs: [
      {
        id: "image-output",
        label: "Image",
        dataType: "image",
      },
    ],
  },

  // Video nodes
  "video-generator-node": {
    description: "Generate videos from text, images, or videos",
    inputs: [
      {
        id: "prompt-input",
        label: "Prompt",
        dataType: "string",
      },
      {
        id: "image-input",
        label: "Image",
        dataType: "image",
      },
      {
        id: "video-input",
        label: "Video",
        dataType: "video",
      },
    ],
    outputs: [
      {
        id: "video-output",
        label: "Video",
        dataType: "video",
      },
    ],
  },
  "animation-node": {
    description: "Animate images with audio",
    inputs: [
      {
        id: "image-input",
        label: "Image",
        dataType: "image",
      },
      {
        id: "audio-input",
        label: "Audio",
        dataType: "audio",
      },
    ],
    outputs: [
      {
        id: "video-output",
        label: "Video",
        dataType: "video",
      },
    ],
  },
  "face-swap-video-node": {
    description: "Swap faces in videos",
    inputs: [
      {
        id: "source-face-input",
        label: "Image",
        dataType: "image",
        required: true,
      },
      {
        id: "video-input",
        label: "Video",
        dataType: "video",
        required: true,
      },
    ],
    outputs: [
      {
        id: "video-output",
        label: "Video",
        dataType: "video",
      },
    ],
  },
  "lip-sync-node": {
    description: "Sync lip movements to audio in videos",
    inputs: [
      {
        id: "audio-input",
        label: "Audio",
        dataType: "audio",
        required: true,
      },
      {
        id: "video-input",
        label: "Video",
        dataType: "video",
        required: true,
      },
    ],
    outputs: [
      {
        id: "video-output",
        label: "Video",
        dataType: "video",
      },
    ],
  },

  // Audio nodes
  "ai-voice-generator-node": {
    description: "Turn text into spoken audio using AI",
    inputs: [
      {
        id: "prompt-input",
        label: "Prompt",
        dataType: "string",
      },
    ],
    outputs: [
      {
        id: "audio-output",
        label: "Audio",
        dataType: "audio",
      },
    ],
  },

  // prototype nodes

  // image nodes
  "image-generator-node-prototype": {
    description: "Create new images from text prompts",
    inputs: [
      {
        id: "prompt-input",
        label: "Prompt",
        dataType: "string",
      },
    ],
    outputs: [
      {
        id: "image-output",
        label: "Image",
        dataType: "image",
      },
    ],
  },
  "ai-image-editor-node-prototype": {
    description: "Edit images with AI using prompts",
    inputs: [
      {
        id: "image-input",
        label: "Image",
        dataType: "image",
        required: true,
      },
      {
        id: "prompt-input",
        label: "Prompt",
        dataType: "string",
        required: true,
      },
    ],
    outputs: [
      {
        id: "image-output",
        label: "Image",
        dataType: "image",
      },
    ],
  },
  "ai-image-upscaler-node-prototype": {
    description: "Enlarge images without losing quality",
    inputs: [
      {
        id: "image-input",
        label: "Image",
        dataType: "image",
        required: true,
      },
    ],
    outputs: [
      {
        id: "image-output",
        label: "Image",
        dataType: "image",
      },
    ],
  },
  "face-swap-node-prototype": {
    description: "Swap faces between two images",
    inputs: [
      {
        id: "source-face-input",
        label: "Image",
        dataType: "image",
        required: true,
      },
      {
        id: "target-face-input",
        label: "Image",
        dataType: "image",
        required: true,
      },
    ],
    outputs: [
      {
        id: "image-output",
        label: "Image",
        dataType: "image",
      },
    ],
  },
  "ai-voice-generator-node-prototype": {
    description: "Turn text into spoken audio using AI",
    inputs: [
      {
        id: "prompt-input",
        label: "Prompt",
        dataType: "string",
      },
    ],
    outputs: [
      {
        id: "audio-output",
        label: "Audio",
        dataType: "audio",
      },
    ],
  },
  "video-generator-node-prototype": {
    description: "Generate videos from text, images, or videos",
    inputs: [
      {
        id: "prompt-input",
        label: "Prompt",
        dataType: "string",
      },
      {
        id: "image-input",
        label: "Image",
        dataType: "image",
      },
      {
        id: "video-input",
        label: "Video",
        dataType: "video",
      },
    ],
    outputs: [
      {
        id: "video-output",
        label: "Video",
        dataType: "video",
      },
    ],
  },
};
