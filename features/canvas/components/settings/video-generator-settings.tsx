"use client";

import React, { useCallback, useMemo } from "react";
import useConfigStore from "../../stores/config-store";
import {
  RESOLUTION_OPTIONS,
  ORIENTATION_OPTIONS,
  END_SECONDS_CONFIG,
  TRIM_CONFIG,
  FPS_RESOLUTION_OPTIONS,
  ART_STYLE_OPTIONS,
  VERSION_OPTIONS,
  PROMPT_TYPE_OPTIONS,
  MODEL_OPTIONS,
} from "../../constants/nodes/video/video-generator-config";
import type { VideoGeneratorNodeConfig } from "../../validations/video";
import {
  CustomSelect,
  CustomSlider,
  SettingsTextarea,
} from "../shared/controls";
import { SettingsItemAnimation } from "@/lib/animations/settings-item-animation";
import { AnimatePresence, motion } from "motion/react";

const MODE_OPTIONS = [
  { value: "text-to-video", label: "Text to Video" },
  { value: "image-to-video", label: "Image to Video" },
  { value: "video-to-video", label: "Video to Video" },
];

const MODE_SECTION_VARIANTS = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

type VideoGeneratorSettingsProps = {
  nodeId: string;
};

const VideoGeneratorSettings: React.FC<VideoGeneratorSettingsProps> = ({
  nodeId,
}) => {
  // Get node config from store
  const nodeConfig = useConfigStore(
    (state) =>
      state.nodeConfigs?.[nodeId] as VideoGeneratorNodeConfig | undefined
  );

  const currentMode = nodeConfig?.mode || "text-to-video";

  // Handler for mode change
  const handleModeChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        mode: value as "text-to-video" | "image-to-video" | "video-to-video",
      });
    },
    [nodeId]
  );

  // Handler for prompt change
  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        prompt: e.target.value,
      });
    },
    [nodeId]
  );

  // Handler for end seconds change
  const handleEndSecondsChange = useCallback(
    (value: number) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        endSeconds: value,
      });
    },
    [nodeId]
  );

  // Handler for start seconds change
  const handleStartSecondsChange = useCallback(
    (value: number) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        startSeconds: value,
      });
    },
    [nodeId]
  );

  // Handler for resolution change
  const handleResolutionChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        resolution: value as "480p" | "720p" | "1080p",
      });
    },
    [nodeId]
  );

  // Handler for orientation change
  const handleOrientationChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        orientation: value as "square" | "landscape" | "portrait",
      });
    },
    [nodeId]
  );

  // Handler for fps resolution change
  const handleFpsResolutionChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        fpsResolution: value as "FULL" | "HALF",
      });
    },
    [nodeId]
  );

  // Handler for art style change
  const handleArtStyleChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        artStyle: value,
      });
    },
    [nodeId]
  );

  // Handler for version change
  const handleVersionChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        version: value as "v1" | "v2" | "default",
      });
    },
    [nodeId]
  );

  // Handler for prompt type change
  const handlePromptTypeChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        promptType: value as "default" | "custom" | "append_default",
      });
    },
    [nodeId]
  );

  // Handler for model change
  const handleModelChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | VideoGeneratorNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        model: value,
      });
    },
    [nodeId]
  );

  // Check if prompt should be shown for video-to-video mode
  const shouldShowPrompt = useMemo(() => {
    return (
      currentMode === "video-to-video" &&
      (nodeConfig?.promptType === "custom" ||
        nodeConfig?.promptType === "append_default")
    );
  }, [currentMode, nodeConfig?.promptType]);

  return (
    <>
      {/* Mode selector dropdown */}
      <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
        <CustomSelect
          className="bg-muted"
          placeholder="Generation Mode"
          value={currentMode}
          onValueChange={handleModeChange}
          items={MODE_OPTIONS}
        />
      </SettingsItemAnimation>

      {/* Mode-specific settings with AnimatePresence */}
      <AnimatePresence mode="wait">
        {currentMode === "text-to-video" && (
          <motion.div
            key="text-to-video"
            variants={MODE_SECTION_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {/* Prompt Textarea */}
            <SettingsItemAnimation className="px-4 mb-4">
              <SettingsTextarea
                value={nodeConfig?.prompt || ""}
                onChange={handlePromptChange}
                placeholder="Enter video prompt here..."
                rows={4}
              />
            </SettingsItemAnimation>

            {/* End Seconds Slider */}
            <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
              <CustomSlider
                label="Duration (seconds)"
                value={nodeConfig?.endSeconds || 5}
                onValueChange={handleEndSecondsChange}
                min={END_SECONDS_CONFIG.min}
                max={END_SECONDS_CONFIG.max}
                step={END_SECONDS_CONFIG.step}
                inputClassName="w-10"
              />
            </SettingsItemAnimation>

            {/* Resolution Selector */}
            <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
              <CustomSelect
                className="bg-muted"
                placeholder="Resolution"
                value={nodeConfig?.resolution || "720p"}
                onValueChange={handleResolutionChange}
                items={RESOLUTION_OPTIONS}
              />
            </SettingsItemAnimation>

            {/* Orientation Selector */}
            <SettingsItemAnimation className="px-4 pt-6">
              <CustomSelect
                className="bg-muted"
                placeholder="Orientation"
                value={nodeConfig?.orientation || "square"}
                onValueChange={handleOrientationChange}
                items={ORIENTATION_OPTIONS}
              />
            </SettingsItemAnimation>
          </motion.div>
        )}

        {currentMode === "image-to-video" && (
          <motion.div
            key="image-to-video"
            variants={MODE_SECTION_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {/* End Seconds Slider */}
            <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
              <CustomSlider
                label="Duration (seconds)"
                value={nodeConfig?.endSeconds || 5}
                onValueChange={handleEndSecondsChange}
                min={END_SECONDS_CONFIG.min}
                max={END_SECONDS_CONFIG.max}
                step={END_SECONDS_CONFIG.step}
                inputClassName="w-10"
              />
            </SettingsItemAnimation>

            {/* Resolution Selector */}
            <SettingsItemAnimation className="px-4 pt-6">
              <CustomSelect
                className="bg-muted"
                placeholder="Resolution"
                value={nodeConfig?.resolution || "720p"}
                onValueChange={handleResolutionChange}
                items={RESOLUTION_OPTIONS}
              />
            </SettingsItemAnimation>
          </motion.div>
        )}

        {currentMode === "video-to-video" && (
          <motion.div
            key="video-to-video"
            variants={MODE_SECTION_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            {/* Start Seconds Slider */}
            <SettingsItemAnimation className="px-4 mb-4">
              <CustomSlider
                label="Start Time (seconds)"
                value={nodeConfig?.startSeconds || 0}
                onValueChange={handleStartSecondsChange}
                min={TRIM_CONFIG.startSeconds.min}
                max={TRIM_CONFIG.startSeconds.max}
                step={TRIM_CONFIG.startSeconds.step}
                inputClassName="w-12"
              />
            </SettingsItemAnimation>

            {/* End Seconds Slider */}
            <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
              <CustomSlider
                label="End Time (seconds)"
                value={nodeConfig?.endSeconds || 5}
                onValueChange={handleEndSecondsChange}
                min={TRIM_CONFIG.endSeconds.min}
                max={TRIM_CONFIG.endSeconds.max}
                step={TRIM_CONFIG.endSeconds.step}
                inputClassName="w-12"
              />
            </SettingsItemAnimation>

            {/* FPS Resolution Selector */}
            <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
              <CustomSelect
                className="bg-muted"
                placeholder="FPS Resolution"
                value={nodeConfig?.fpsResolution || "HALF"}
                onValueChange={handleFpsResolutionChange}
                items={FPS_RESOLUTION_OPTIONS}
              />
            </SettingsItemAnimation>

            {/* Art Style Selector */}
            <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
              <CustomSelect
                className="bg-muted"
                placeholder="Art Style"
                value={nodeConfig?.artStyle || "Pixel"}
                onValueChange={handleArtStyleChange}
                items={ART_STYLE_OPTIONS}
              />
            </SettingsItemAnimation>

            {/* Version Selector */}
            <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
              <CustomSelect
                className="bg-muted"
                placeholder="Version"
                value={nodeConfig?.version || "default"}
                onValueChange={handleVersionChange}
                items={VERSION_OPTIONS}
              />
            </SettingsItemAnimation>

            {/* Prompt Type Selector */}
            <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
              <CustomSelect
                className="bg-muted"
                placeholder="Prompt Type"
                value={nodeConfig?.promptType || "default"}
                onValueChange={handlePromptTypeChange}
                items={PROMPT_TYPE_OPTIONS}
              />
            </SettingsItemAnimation>

            {/* Model Selector */}
            <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
              <CustomSelect
                className="bg-muted"
                placeholder="Model"
                value={nodeConfig?.model || "default"}
                onValueChange={handleModelChange}
                items={MODEL_OPTIONS}
              />
            </SettingsItemAnimation>

            {/* Prompt Textarea (conditional) */}
            {shouldShowPrompt && (
              <SettingsItemAnimation className="px-4 pt-6">
                <SettingsTextarea
                  value={nodeConfig?.prompt || ""}
                  onChange={handlePromptChange}
                  placeholder="Enter your prompt here..."
                  rows={4}
                />
              </SettingsItemAnimation>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(VideoGeneratorSettings);
