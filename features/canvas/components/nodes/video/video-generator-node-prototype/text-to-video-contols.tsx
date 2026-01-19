"use client";

import React from "react";
import PromptBlock from "../../../shared/blocks/prompt-block";
import CustomSlider from "../../../shared/controls/custom-slider";
import VideoPreview from "../../../shared/assets/video-preview";
import { END_SECONDS_CONFIG } from "../../../../constants/nodes/video/video-generator-config";
import ConnectedAssetDisplay from "../../../shared/assets/connected-asset-display";
import GenerateButton, {
  type ButtonState,
} from "../../../shared/generate-button/generate-button";
import { AnimatedOrientationSelect } from "../../../shared/controls";
import type { NodeFlowConfig } from "../../../../types/sidebar.types";

type TextToVideoControlsProps = {
  nodeId: string;
  prompt?: string;
  endSeconds?: number;
  videoUrl?: string;
  isGenerating?: boolean;
  orientation?: "square" | "landscape" | "portrait";
  previewHeight?: number;
  onPromptChange?: (prompt: string) => void;
  onPromptBlur?: (prompt: string) => void;
  onEndSecondsChange?: (value: number) => void;
  onVideoClick?: () => void;
  flowConfig?: NodeFlowConfig | null;
  connectedAssets?: Record<string, any>;
  isHandleDisabled?: (handleId: string) => boolean;
  onGenerate?: () => void;
  buttonState?: ButtonState;
  isNodeDisabled?: boolean;
  onOrientationChange?: (value: "square" | "landscape" | "portrait") => void;
};

const TextToVideoControls: React.FC<TextToVideoControlsProps> = ({
  nodeId,
  prompt = "",
  endSeconds,
  videoUrl,
  isGenerating,
  orientation,
  previewHeight,
  onPromptChange,
  onPromptBlur,
  onEndSecondsChange,
  onVideoClick,
  flowConfig,
  connectedAssets,
  isHandleDisabled,
  onGenerate,
  buttonState,
  isNodeDisabled,
  onOrientationChange,
}) => {
  return (
    <div className="flex flex-col">
      {/* generation prompt */}
      <PromptBlock
        nodeId={nodeId}
        prompt={prompt}
        placeholder="Enter video prompt here..."
        targetHandle="prompt-input"
        sourceNodeType="text-node"
        onPromptChange={onPromptChange}
        onPromptBlur={onPromptBlur}
        className="mb-2"
      />

      {/* duration slider */}
      <div className="flex flex-col gap-1 mb-3">
        <label className="text-xs text-muted-foreground">
          Duration (seconds)
        </label>
        <CustomSlider
          value={endSeconds || END_SECONDS_CONFIG.min}
          onValueChange={onEndSecondsChange || (() => {})}
          inputClassName="w-10"
          min={END_SECONDS_CONFIG.min}
          max={END_SECONDS_CONFIG.max}
          step={END_SECONDS_CONFIG.step}
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
      <div className="flex items-center justify-between mt-1 ">
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
          {onOrientationChange && (
            <AnimatedOrientationSelect
              value={orientation || "square"}
              onChange={onOrientationChange}
            />
          )}
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

export default TextToVideoControls;
