"use client";

import React, { useCallback, useMemo } from "react";
import useConfigStore from "../../stores/config-store";
import {
  FACE_SWAP_MODE_OPTIONS,
  IMAGE_SOURCE_OPTIONS,
} from "../../constants/nodes/image/face-swap-config";
import type { FaceSwapNodeConfig } from "../../validations/image";
import { CustomSelect, SettingsTextarea } from "../shared/controls";
import { SettingsItemAnimation } from "@/lib/animations/settings-item-animation";

type FaceSwapImageSettingsProps = {
  nodeId: string;
};

const FaceSwapImageSettings: React.FC<FaceSwapImageSettingsProps> = ({
  nodeId,
}) => {
  // Get node config from store
  const nodeConfig = useConfigStore(
    (state) => state.nodeConfigs?.[nodeId] as FaceSwapNodeConfig | undefined
  );

  const imageSource = useMemo(
    () => nodeConfig?.assets?.imageSource || "file",
    [nodeConfig?.assets?.imageSource]
  );

  // Handler for image source change - use getState() to avoid function subscription
  const handleImageSourceChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | FaceSwapNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        assets: {
          ...(currentConfig?.assets || {}),
          imageSource: value as "file" | "youtube",
        },
      });
    },
    [nodeId]
  );

  // Handler for YouTube URL change - use getState() to avoid function subscription
  const handleYoutubeUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | FaceSwapNodeConfig
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

  // Handler for face swap mode change - use getState() to avoid function subscription
  const handleFaceSwapModeChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | FaceSwapNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        faceSwapMode: value as "all-faces" | "individual-faces",
      });
    },
    [nodeId]
  );

  return (
    <>
      {/* Swap mode Selector */}
      <SettingsItemAnimation className="px-4 mb-4">
        <CustomSelect
          placeholder="Swap Mode"
          value={nodeConfig?.faceSwapMode || "all-faces"}
          className="bg-muted"
          defaultValue="all-faces"
          onValueChange={handleFaceSwapModeChange}
          items={FACE_SWAP_MODE_OPTIONS}
        />
      </SettingsItemAnimation>

      {/* Image Source Selector */}
      <SettingsItemAnimation className="px-4 border-b border-border pb-6">
        <CustomSelect
          className="bg-muted"
          placeholder="Image Source"
          value={nodeConfig?.assets?.imageSource || "file"}
          onValueChange={handleImageSourceChange}
          items={IMAGE_SOURCE_OPTIONS}
        />
      </SettingsItemAnimation>

      {/* YouTube URL */}
      <SettingsItemAnimation className="px-4 pt-6">
        <SettingsTextarea
          value={nodeConfig?.assets?.youtubeUrl || ""}
          onChange={handleYoutubeUrlChange}
          disabled={imageSource !== "youtube"}
          placeholder="Enter YouTube URL..."
          rows={3}
          showTooltip={imageSource !== "youtube"}
          tooltipText='Select "YouTube URL" as image source.'
          tooltipSide="left"
          tooltipSideOffset={32}
        />
      </SettingsItemAnimation>
    </>
  );
};

export default React.memo(FaceSwapImageSettings);
