import {
  TextIcon,
  AIImageGeneratorIcon,
  DiagonalIcon,
  BackgroundIcon,
  FaceIcon,
  ImageToVideoIcon,
  AnimationIcon,
  LipSyncIcon,
  PencilIcon,
  MyPlanIcon,
  MusicIcon,
} from "@/constants/icons";
import {
  PreviewNodesConstants,
  PreviewNodeSection,
  NodeFlowConfig,
} from "../../types/sidebar.types";

export const PREVIEW_NODES: PreviewNodesConstants = {
  inputs: {
    title: "Inputs",
    nodes: [
      {
        icon: TextIcon,
        title: "Prompt",
        nodeType: "text-node",
        iconSize: 18,
        flow: {
          inputs: [],
          outputs: [
            {
              id: "prompt-output",
              type: "source",
              dataType: "string",
              label: "Prompt",
              position: "right",
              required: true,
            },
          ],
        },
      },
      {
        icon: MyPlanIcon,
        title: "Upload Media",
        nodeType: "upload-node",
        iconSize: 18,
        configOptions: false,
        flow: {
          inputs: [],
          outputs: [],
        },
      },
    ],
  },
  imageTools: {
    title: "Image tools",
    nodes: [
      {
        icon: AIImageGeneratorIcon,
        title: "Generate Image",
        nodeType: "image-generator-node",
        iconSize: 21,
        configOptions: true,
        flow: {
          inputs: [
            {
              id: "prompt-input",
              type: "target",
              dataType: "string",
              label: "Prompt",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "image-output",
              type: "source",
              dataType: "image",
              label: "Image",
              position: "right",
            },
          ],
        },
      },

      {
        icon: PencilIcon,
        title: "Edit Image",
        nodeType: "ai-image-editor-node",
        iconSize: 18,
        configOptions: true,
        flow: {
          inputs: [
            {
              id: "image-input",
              type: "target",
              dataType: "image",
              label: "Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
            {
              id: "prompt-input",
              type: "target",
              dataType: "string",
              label: "Prompt",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "image-output",
              type: "source",
              dataType: "image",
              label: "Image",
              position: "right",
            },
          ],
        },
      },
      {
        icon: DiagonalIcon,
        title: "Upscale Image",
        nodeType: "ai-image-upscaler-node",
        iconSize: 18,
        configOptions: true,
        flow: {
          inputs: [
            {
              id: "image-input",
              type: "target",
              dataType: "image",
              label: "Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "image-output",
              type: "source",
              dataType: "image",
              label: "Image",
              position: "right",
            },
          ],
        },
      },
      {
        icon: BackgroundIcon,
        title: "Remove Background",
        nodeType: "remove-background-node",
        iconSize: 18,
        configOptions: false,
        flow: {
          inputs: [
            {
              id: "image-input",
              type: "target",
              dataType: "image",
              label: "Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "image-output",
              type: "source",
              dataType: "image",
              label: "Image",
              position: "right",
            },
          ],
        },
      },
      {
        icon: FaceIcon,
        title: "Swap Face (Image)",
        nodeType: "face-swap-node",
        iconSize: 18,
        configOptions: true,
        flow: {
          inputs: [
            {
              id: "source-face-input",
              type: "target",
              dataType: "image",
              label: "Face Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
            {
              id: "target-face-input",
              type: "target",
              dataType: "image",
              label: "Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "image-output",
              type: "source",
              dataType: "image",
              label: "Image",
              position: "right",
            },
          ],
        },
      },
    ],
  },
  videoTools: {
    title: "Video tools",
    nodes: [
      {
        icon: ImageToVideoIcon,
        title: "Generate Video",
        nodeType: "video-generator-node",
        iconSize: 20,
        configOptions: true,
        flow: {
          inputs: [
            {
              id: "prompt-input",
              type: "target",
              dataType: "string",
              label: "Prompt",
              position: "left",
              maxConnections: 1,
            },
            {
              id: "image-input",
              type: "target",
              dataType: "image",
              label: "Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
            {
              id: "video-input",
              type: "target",
              dataType: "video",
              label: "Video",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "video-output",
              type: "source",
              dataType: "video",
              label: "Video",
              position: "right",
            },
          ],
        },
      },
      {
        icon: AnimationIcon,
        title: "Create Animation",
        nodeType: "animation-node",
        iconSize: 18,
        configOptions: true,
        flow: {
          inputs: [
            {
              id: "image-input",
              type: "target",
              dataType: "image",
              label: "Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
            {
              id: "audio-input",
              type: "target",
              dataType: "audio",
              label: "Audio",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "video-output",
              type: "source",
              dataType: "video",
              label: "Video",
              position: "right",
            },
          ],
        },
      },
      {
        icon: FaceIcon,
        title: "Swap Face (Video)",
        nodeType: "face-swap-video-node",
        iconSize: 18,
        configOptions: true,
        flow: {
          inputs: [
            {
              id: "source-face-input",
              type: "target",
              dataType: "image",
              label: "Face Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
            {
              id: "video-input",
              type: "target",
              dataType: "video",
              label: "Video",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "video-output",
              type: "source",
              dataType: "video",
              label: "Video",
              position: "right",
            },
          ],
        },
      },
      {
        icon: LipSyncIcon,
        title: "Sync Lips",
        nodeType: "lip-sync-node",
        iconSize: 18,
        configOptions: true,
        flow: {
          inputs: [
            {
              id: "audio-input",
              type: "target",
              dataType: "audio",
              label: "Audio",
              position: "left",
              required: true,
              maxConnections: 1,
            },
            {
              id: "video-input",
              type: "target",
              dataType: "video",
              label: "Video",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "video-output",
              type: "source",
              dataType: "video",
              label: "Video",
              position: "right",
            },
          ],
        },
      },
    ],
  },
  audioTools: {
    title: "Audio Tools",
    nodes: [
      {
        icon: MusicIcon,
        title: "Generate Voice",
        nodeType: "ai-voice-generator-node",
        iconSize: 18,
        configOptions: true,
        flow: {
          inputs: [
            {
              id: "prompt-input",
              type: "target",
              dataType: "string",
              label: "Prompt",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "audio-output",
              type: "source",
              dataType: "audio",
              label: "Audio",
              position: "right",
            },
          ],
        },
      },
    ],
  },
  helpers: {
    title: "Helpers",
    nodes: [
      {
        icon: TextIcon,
        title: "Sticky Note",
        nodeType: "note-node",
        iconSize: 18,
      },
    ],
  },
  prototype: {
    title: "Prototype",
    nodes: [
      {
        icon: AIImageGeneratorIcon,
        title: "Generate Image (E)",
        nodeType: "image-generator-node-prototype",
        iconSize: 21,
        flow: {
          inputs: [
            {
              id: "prompt-input",
              type: "target",
              dataType: "string",
              label: "Prompt",
              position: "left",
              required: false,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "image-output",
              type: "source",
              dataType: "image",
              label: "Image",
              position: "right",
              required: false,
              maxConnections: 1,
            },
          ],
        },
      },
      {
        icon: PencilIcon,
        title: "Edit Image (E)",
        nodeType: "ai-image-editor-node-prototype",
        iconSize: 18,
        flow: {
          inputs: [
            {
              id: "image-input",
              type: "target",
              dataType: "image",
              label: "Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
            {
              id: "prompt-input",
              type: "target",
              dataType: "string",
              label: "Prompt",
              position: "left",
              required: false,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "image-output",
              type: "source",
              dataType: "image",
              label: "Image",
              position: "right",
            },
          ],
        },
      },
      {
        icon: DiagonalIcon,
        title: "Upscale Image (E)",
        nodeType: "ai-image-upscaler-node-prototype",
        iconSize: 18,
        flow: {
          inputs: [
            {
              id: "image-input",
              type: "target",
              dataType: "image",
              label: "Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "image-output",
              type: "source",
              dataType: "image",
              label: "Image",
              position: "right",
            },
          ],
        },
      },
      {
        icon: FaceIcon,
        title: "Swap Face (Image) (E)",
        nodeType: "face-swap-node-prototype",
        iconSize: 18,
        flow: {
          inputs: [
            {
              id: "source-face-input",
              type: "target",
              dataType: "image",
              label: "Face Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
            {
              id: "target-face-input",
              type: "target",
              dataType: "image",
              label: "Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "image-output",
              type: "source",
              dataType: "image",
              label: "Image",
              position: "right",
            },
          ],
        },
      },
      {
        icon: MusicIcon,
        title: "Generate Voice (E)",
        nodeType: "ai-voice-generator-node-prototype",
        iconSize: 18,
        flow: {
          inputs: [
            {
              id: "prompt-input",
              type: "target",
              dataType: "string",
              label: "Prompt",
              position: "left",
              required: false,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "audio-output",
              type: "source",
              dataType: "audio",
              label: "Audio",
              position: "right",
            },
          ],
        },
      },
      {
        icon: ImageToVideoIcon,
        title: "Generate Video (E)",
        nodeType: "video-generator-node-prototype",
        iconSize: 20,
        flow: {
          inputs: [
            {
              id: "prompt-input",
              type: "target",
              dataType: "string",
              label: "Prompt",
              position: "left",
              maxConnections: 1,
            },
            {
              id: "image-input",
              type: "target",
              dataType: "image",
              label: "Image",
              position: "left",
              required: true,
              maxConnections: 1,
            },
            {
              id: "video-input",
              type: "target",
              dataType: "video",
              label: "Video",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "video-output",
              type: "source",
              dataType: "video",
              label: "Video",
              position: "right",
            },
          ],
        },
      },
      {
        icon: LipSyncIcon,
        title: "Sync Lips (E)",
        nodeType: "lip-sync-node-prototype",
        iconSize: 18,
        flow: {
          inputs: [
            {
              id: "audio-input",
              type: "target",
              dataType: "audio",
              label: "Audio",
              position: "left",
              required: true,
              maxConnections: 1,
            },
            {
              id: "video-input",
              type: "target",
              dataType: "video",
              label: "Video",
              position: "left",
              required: true,
              maxConnections: 1,
            },
          ],
          outputs: [
            {
              id: "video-output",
              type: "source",
              dataType: "video",
              label: "Video",
              position: "right",
            },
          ],
        },
      },
    ],
  },
};

// Helper function to get all sections for easy iteration
export const getAllPreviewSections = (): PreviewNodeSection[] =>
  Object.values(PREVIEW_NODES);

// Helper function to get node flow configuration by nodeType
export const getNodeFlowConfig = (nodeType: string): NodeFlowConfig | null => {
  for (const section of getAllPreviewSections()) {
    const node = section.nodes.find((n) => n.nodeType === nodeType);
    if (node) return node.flow || null;
  }
  return null;
};
