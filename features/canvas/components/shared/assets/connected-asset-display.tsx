"use client";

import React, { memo } from "react";

import { ImageIcon, VideoIcon, MusicIcon } from "@/constants/icons";
import {
  AssetPreviewAnimation,
  SoundwaveBar,
} from "@/lib/animations/asset-preview-animation";

// Animated Soundwave Component
const AnimatedSoundwave: React.FC<{ disabled?: boolean }> = memo(
  ({ disabled = false }) => {
    const barColor = disabled ? "bg-gray-400" : "bg-red-500";

    return (
      <AssetPreviewAnimation className="flex items-center justify-center gap-0.5 size-6 border border-border bg-[#1e1f32] rounded overflow-hidden">
        <SoundwaveBar
          heights={["25%", "45%", "25%"]}
          duration={0.8}
          color={barColor}
        />
        <SoundwaveBar
          heights={["40%", "60%", "40%"]}
          duration={0.6}
          delay={0.1}
          color={barColor}
        />
        <SoundwaveBar
          heights={["20%", "35%", "20%"]}
          duration={0.7}
          delay={0.2}
          color={barColor}
        />
        <SoundwaveBar
          heights={["45%", "65%", "45%"]}
          duration={0.9}
          delay={0.3}
          color={barColor}
        />
        <SoundwaveBar
          heights={["30%", "50%", "30%"]}
          duration={0.5}
          delay={0.4}
          color={barColor}
        />
        <SoundwaveBar
          heights={["22%", "38%", "22%"]}
          duration={0.8}
          delay={0.5}
          color={barColor}
        />
        <SoundwaveBar
          heights={["38%", "55%", "38%"]}
          duration={0.6}
          delay={0.6}
          color={barColor}
        />
        <SoundwaveBar
          heights={["18%", "32%", "18%"]}
          duration={0.7}
          delay={0.7}
          color={barColor}
        />
      </AssetPreviewAnimation>
    );
  }
);

AnimatedSoundwave.displayName = "AnimatedSoundwave";

type ConnectedAssetDisplayProps = {
  connectedAsset: {
    fileName: string;
    type: string;
    previewUrl?: string;
  } | null;
  disabled?: boolean;
};

const ASSET_ICONS = {
  image: ImageIcon,
  video: VideoIcon,
  audio: MusicIcon,
} as const;

const ConnectedAssetDisplay: React.FC<ConnectedAssetDisplayProps> = memo(
  ({ connectedAsset, disabled = false }) => {
    if (!connectedAsset) return null;

    return (
      <div
        className={`flex items-center gap-2 text-xs text-muted-foreground mb-1 transition-opacity ${
          disabled ? "opacity-50" : ""
        }`}
      >
        {/* Asset Preview or Icon */}
        {(connectedAsset.type === "image" || connectedAsset.type === "video") &&
        connectedAsset.previewUrl ? (
          <AssetPreviewAnimation className="size-6 rounded overflow-hidden flex-shrink-0">
            {connectedAsset.type === "image" ? (
              <img
                src={connectedAsset.previewUrl}
                alt={connectedAsset.fileName}
                className="w-full h-full object-cover"
              />
            ) : (
              <video
                src={connectedAsset.previewUrl}
                className="w-full h-full object-cover"
                muted
              />
            )}
          </AssetPreviewAnimation>
        ) : (
          <AnimatedSoundwave disabled={disabled} />
        )}
      </div>
    );
  },
  // Custom comparison - only re-render if the asset actually changes
  (prevProps, nextProps) => {
    const prevAsset = prevProps.connectedAsset;
    const nextAsset = nextProps.connectedAsset;

    // Both null - no change
    if (!prevAsset && !nextAsset && prevProps.disabled === nextProps.disabled)
      return true;

    // One null, one not - change
    if (!prevAsset || !nextAsset || prevProps.disabled !== nextProps.disabled)
      return false;

    // Compare asset properties
    return (
      prevAsset.fileName === nextAsset.fileName &&
      prevAsset.type === nextAsset.type &&
      prevAsset.previewUrl === nextAsset.previewUrl
    );
  }
);

ConnectedAssetDisplay.displayName = "ConnectedAssetDisplay";

export default ConnectedAssetDisplay;
