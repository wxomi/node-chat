import {
  TextIcon,
  TextMagicIcon,
  ImageIcon,
  AIImageGeneratorIcon,
  DiagonalIcon,
  BackgroundIcon,
  FaceIcon,
  VideoIcon,
  ImageToVideoIcon,
  AnimationIcon,
  LipSyncIcon,
  MyPlanIcon,
  MusicIcon,
} from "@/constants/icons";
import { StaticImageData } from "next/image";

type NodeTypeIcon = {
  nodeType: string;
  icon: StaticImageData;
};

export const NODE_TYPE_ICONS: Record<string, StaticImageData> = {
  "text-node": TextIcon,
  "prompt-enhancer-node": TextMagicIcon,
  "upload-node": MyPlanIcon,
  "image-generator-node": AIImageGeneratorIcon,
  "ai-image-editor-node": ImageIcon,
  "ai-image-upscaler-node": DiagonalIcon,
  "remove-background-node": BackgroundIcon,
  "face-swap-node": FaceIcon,
  "video-generator-node": ImageToVideoIcon,
  "animation-node": AnimationIcon,
  "face-swap-video-node": FaceIcon,
  "lip-sync-node": LipSyncIcon,
  "ai-voice-generator-node": MusicIcon,
};

// Node types that can be batch generated (have generate handlers)
export const BATCHABLE_NODE_TYPES = [
  "image-generator-node",
  "ai-image-editor-node",
  "ai-image-upscaler-node",
  "remove-background-node",
  "face-swap-node",
  "video-generator-node",
  "animation-node",
  "face-swap-video-node",
  "lip-sync-node",
  "ai-voice-generator-node",
];
