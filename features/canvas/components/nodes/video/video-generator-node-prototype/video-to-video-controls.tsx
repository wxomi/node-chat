"use client";

import React from "react";
import CustomSelect from "../../../shared/controls/custom-select";
import CustomSlider from "../../../shared/controls/custom-slider";
import VideoPreview from "../../../shared/assets/video-preview";
import {
  ART_STYLE_OPTIONS,
  TRIM_CONFIG,
} from "../../../../constants/nodes/video/video-generator-config";
import ConnectedAssetDisplay from "../../../shared/assets/connected-asset-display";
import GenerateButton, {
  type ButtonState,
} from "../../../shared/generate-button/generate-button";
import type { NodeFlowConfig } from "../../../../types/sidebar.types";

type VideoToVideoControlsProps = {
  artStyle?: string;
  startSeconds?: number;
  endSeconds?: number;
  videoUrl?: string;
  isGenerating?: boolean;
  orientation?: "square" | "landscape" | "portrait";
  previewHeight?: number;
  onArtStyleChange?: (value: string) => void;
  onStartSecondsChange?: (value: number) => void;
  onEndSecondsChange?: (value: number) => void;
  onVideoClick?: () => void;
  flowConfig?: NodeFlowConfig | null;
  connectedAssets?: Record<string, any>;
  isHandleDisabled?: (handleId: string) => boolean;
  onGenerate?: () => void;
  buttonState?: ButtonState;
  isNodeDisabled?: boolean;
};

const VideoToVideoControls: React.FC<VideoToVideoControlsProps> = ({
  artStyle,
  startSeconds,
  endSeconds,
  videoUrl,
  isGenerating,
  orientation,
  previewHeight,
  onArtStyleChange,
  onStartSecondsChange,
  onEndSecondsChange,
  onVideoClick,
  flowConfig,
  connectedAssets,
  isHandleDisabled,
  onGenerate,
  buttonState,
  isNodeDisabled,
}) => {
  return (
    <div className="flex flex-col">
      {/* Art Style Select */}
      <CustomSelect
        placeholder="Art Style"
        value={artStyle || "Pixel"}
        className="border-border bg-accent focus-visible:border-border mb-4"
        defaultValue="Pixel"
        onValueChange={onArtStyleChange || (() => {})}
        items={ART_STYLE_OPTIONS}
      />

      {/* Start Time Slider */}
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs text-muted-foreground">
          Start Time (seconds)
        </label>
        <CustomSlider
          value={startSeconds || TRIM_CONFIG.startSeconds.min}
          onValueChange={onStartSecondsChange || (() => {})}
          inputClassName="w-12"
          min={TRIM_CONFIG.startSeconds.min}
          max={TRIM_CONFIG.startSeconds.max}
          step={TRIM_CONFIG.startSeconds.step}
        />
      </div>

      {/* End Time Slider */}
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs text-muted-foreground">
          End Time (seconds)
        </label>
        <CustomSlider
          value={endSeconds || TRIM_CONFIG.endSeconds.min}
          onValueChange={onEndSecondsChange || (() => {})}
          inputClassName="w-12"
          min={TRIM_CONFIG.endSeconds.min}
          max={TRIM_CONFIG.endSeconds.max}
          step={TRIM_CONFIG.endSeconds.step}
        />
      </div>

      {/* Video preview */}
      <VideoPreview
        videoUrl={videoUrl}
        isGenerating={isGenerating || false}
        onVideoClick={onVideoClick}
        orientation={orientation}
        height={previewHeight}
      />

      {/* Generate button and connected assets */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex flex-row gap-2 h-6">
          {flowConfig?.inputs.map((input) => (
            <ConnectedAssetDisplay
              key={input.id}
              connectedAsset={connectedAssets?.[input.id]}
              disabled={isHandleDisabled?.(input.id) || false}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {onGenerate && buttonState && (
            <GenerateButton
              onClick={onGenerate}
              state={buttonState}
              isLoading={isGenerating}
              disabled={isGenerating || isNodeDisabled}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoToVideoControls;
