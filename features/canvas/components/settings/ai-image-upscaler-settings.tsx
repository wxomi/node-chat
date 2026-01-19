"use client";

import React, { useCallback } from "react";
import useConfigStore from "../../stores/config-store";
import {
  SCALE_FACTOR_OPTIONS,
  ENHANCEMENT_OPTIONS,
} from "../../constants/nodes/image/ai-image-upscaler-config";
import type { AIImageUpscalerNodeConfig } from "../../validations/image";
import { CustomSelect, SettingsTextarea } from "../shared/controls";
import { SettingsItemAnimation } from "@/lib/animations/settings-item-animation";

type AIImageUpscalerSettingsProps = {
  nodeId: string;
};

const AIImageUpscalerSettings: React.FC<AIImageUpscalerSettingsProps> = ({
  nodeId,
}) => {
  // Get node config from store
  const nodeConfig = useConfigStore(
    (state) =>
      state.nodeConfigs?.[nodeId] as AIImageUpscalerNodeConfig | undefined
  );

  // Handler for scale factor change - use getState() to avoid function subscription
  const handleScaleFactorChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | AIImageUpscalerNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        scaleFactor: value as "2" | "4",
      });
    },
    [nodeId]
  );

  // Handler for enhancement change - use getState() to avoid function subscription
  const handleEnhancementChange = useCallback(
    (value: string) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | AIImageUpscalerNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        enhancement: value as "Resemblance" | "Balanced" | "Creative",
      });
    },
    [nodeId]
  );

  // Handler for prompt change - use getState() to avoid function subscription
  const handlePromptChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const store = useConfigStore.getState();
      const currentConfig = store.nodeConfigs?.[nodeId] as
        | AIImageUpscalerNodeConfig
        | undefined;
      store.updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        prompt: e.target.value,
      });
    },
    [nodeId]
  );

  const isPromptDisabled = nodeConfig?.enhancement !== "Creative";

  return (
    <>
      {/* Scale Factor Selector */}
      <SettingsItemAnimation className="px-4 mb-4">
        <CustomSelect
          className="bg-muted"
          placeholder="Scale Factor"
          value={nodeConfig?.scaleFactor || "2"}
          onValueChange={handleScaleFactorChange}
          items={SCALE_FACTOR_OPTIONS}
        />
      </SettingsItemAnimation>

      {/* Enhancement Selector */}
      <SettingsItemAnimation className="px-4 border-b border-border pb-6">
        <CustomSelect
          className="bg-muted"
          placeholder="Enhancement"
          value={nodeConfig?.enhancement || "Balanced"}
          onValueChange={handleEnhancementChange}
          items={ENHANCEMENT_OPTIONS}
        />
      </SettingsItemAnimation>

      {/* prompt textarea */}
      <SettingsItemAnimation className="px-4 pt-6">
        <SettingsTextarea
          value={nodeConfig?.prompt || ""}
          onChange={handlePromptChange}
          disabled={isPromptDisabled}
          placeholder="Enter your prompt here..."
          rows={4}
          showTooltip={isPromptDisabled}
          tooltipText='Select "Creative" enhancement to enable prompt'
          tooltipSide="bottom"
          tooltipSideOffset={32}
        />
      </SettingsItemAnimation>
    </>
  );
};

export default React.memo(AIImageUpscalerSettings);
