import { StaticImageData } from "next/image";
import { DiagonalIcon, FaceIcon, LipSyncIcon } from "@/constants/icons";

export type NodeSettingsConfig = {
  name: string;
  icon: StaticImageData;
};

export const NODE_SETTINGS_MAPPING: Record<string, NodeSettingsConfig> = {
  "ai-image-upscaler-node-prototype": {
    name: "Image Upscaler",
    icon: DiagonalIcon,
  },
  "face-swap-node-prototype": {
    name: "Face Swap",
    icon: FaceIcon,
  },
  "video-generator-node-prototype": {
    name: "Video Generator",
    icon: FaceIcon,
  },
  "lip-sync-node-prototype": {
    name: "Lip Sync",
    icon: LipSyncIcon,
  },
};

export const getNodeDisplayName = (nodeType: string | undefined): string => {
  if (!nodeType) return "Settings";
  const mapped = NODE_SETTINGS_MAPPING[nodeType];
  return mapped?.name;
};

export const getNodeIcon = (nodeType: string | undefined): StaticImageData => {
  if (!nodeType) return DiagonalIcon;
  const mapped = NODE_SETTINGS_MAPPING[nodeType];
  return mapped?.icon;
};
