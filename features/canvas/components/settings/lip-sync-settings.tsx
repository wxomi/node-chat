"use client";

import React, { useCallback, useMemo } from "react";
import useConfigStore from "../../stores/config-store";
import {
  GENERATION_MODE_OPTIONS,
  MAX_FPS_CONFIG,
  TRIM_CONFIG,
} from "../../constants/nodes/video/lip-sync-config";
import type { LipSyncNodeConfig } from "../../validations/video";
import {
  CustomSelect,
  CustomSlider,
  SettingsTextarea,
} from "../shared/controls";
import { SettingsItemAnimation } from "@/lib/animations/settings-item-animation";

type LipSyncSettingsProps = {
  nodeId: string;
};

const VIDEO_SOURCE_OPTIONS = [
  { value: "file", label: "Video" },
  { value: "youtube", label: "YouTube" },
];

const LipSyncSettings: React.FC<LipSyncSettingsProps> = ({ nodeId }) => {
  const nodeConfig = useConfigStore(
    (state) => state.nodeConfigs?.[nodeId] as LipSyncNodeConfig | undefined
  );

  const videoSource = useMemo(
    () => nodeConfig?.assets?.videoSource || "file",
    [nodeConfig?.assets?.videoSource]
  );

  const handleGenerationModeChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | LipSyncNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        style: {
          ...(currentConfig?.style || {}),
          generationMode: value as "lite" | "standard" | "pro",
        },
      });
    },
    [nodeId]
  );

  const handleMaxFpsChange = useCallback(
    (value: number) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | LipSyncNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        maxFpsLimit: value,
      });
    },
    [nodeId]
  );

  const handleStartSecondsChange = useCallback(
    (value: number) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | LipSyncNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        startSeconds: value,
      });
    },
    [nodeId]
  );

  const handleEndSecondsChange = useCallback(
    (value: number) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | LipSyncNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        endSeconds: value,
      });
    },
    [nodeId]
  );

  const handleVideoSourceChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | LipSyncNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        assets: {
          ...(currentConfig?.assets || {}),
          videoSource: value as "file" | "youtube",
        },
      });
    },
    [nodeId]
  );

  const handleYoutubeUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | LipSyncNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        assets: {
          ...(currentConfig?.assets || {}),
          youtubeUrl: e.target.value,
        },
      });
    },
    [nodeId]
  );

  return (
    <>
      <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
        <CustomSelect
          className="bg-muted"
          placeholder="Generation Mode"
          value={nodeConfig?.style?.generationMode || "lite"}
          defaultValue="lite"
          onValueChange={handleGenerationModeChange}
          items={GENERATION_MODE_OPTIONS}
        />
      </SettingsItemAnimation>

      <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
        <CustomSlider
          label="Max FPS Limit"
          value={nodeConfig?.maxFpsLimit || 12}
          onValueChange={handleMaxFpsChange}
          inputClassName="w-10"
          min={MAX_FPS_CONFIG.min}
          max={MAX_FPS_CONFIG.max}
          step={MAX_FPS_CONFIG.step}
        />
      </SettingsItemAnimation>

      <SettingsItemAnimation className="px-4 mb-4">
        <CustomSlider
          label="Start Time (seconds)"
          value={nodeConfig?.startSeconds || 0}
          onValueChange={handleStartSecondsChange}
          inputClassName="w-12"
          min={TRIM_CONFIG.startSeconds.min}
          max={TRIM_CONFIG.startSeconds.max}
          step={TRIM_CONFIG.startSeconds.step}
        />
      </SettingsItemAnimation>

      <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
        <CustomSlider
          label="End Time (seconds)"
          value={nodeConfig?.endSeconds || 15}
          onValueChange={handleEndSecondsChange}
          inputClassName="w-12"
          min={TRIM_CONFIG.endSeconds.min}
          max={TRIM_CONFIG.endSeconds.max}
          step={TRIM_CONFIG.endSeconds.step}
        />
      </SettingsItemAnimation>

      <SettingsItemAnimation className="px-4 mb-4 border-b border-border pb-6">
        <CustomSelect
          className="bg-muted"
          placeholder="Video Source"
          value={videoSource}
          defaultValue="file"
          onValueChange={handleVideoSourceChange}
          items={VIDEO_SOURCE_OPTIONS}
        />
      </SettingsItemAnimation>

      <SettingsItemAnimation className="px-4 pt-2">
        <SettingsTextarea
          value={nodeConfig?.assets?.youtubeUrl || ""}
          onChange={handleYoutubeUrlChange}
          disabled={videoSource !== "youtube"}
          placeholder="Enter YouTube URL..."
          rows={3}
          showTooltip={videoSource !== "youtube"}
          tooltipText='Select "YouTube" as video source.'
          tooltipSide="left"
          tooltipSideOffset={32}
        />
      </SettingsItemAnimation>
    </>
  );
};

export default React.memo(LipSyncSettings);
