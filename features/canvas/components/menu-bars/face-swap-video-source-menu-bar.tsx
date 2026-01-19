"use client";

import React, { useCallback, useState, useMemo } from "react";
import Image from "next/image";
import useConfigStore from "../../stores/config-store";
import { YouTubeIcon } from "@/constants/icons";
import { motion } from "motion/react";
import { useEffect } from "react";
import { YouTubeButton } from "../../components/shared/controls";

export type VideoSourceMenuOption = {
  id: string;
  label: string;
  chartColor?: "chart-1" | "chart-2" | "chart-3" | "chart-5" | "red";
  icon?: any;
  showRing?: boolean;
};

type MenuBarProps = {
  options: VideoSourceMenuOption[];
  activeOptionId?: string;
  nodeId?: string;
  onOptionClick?: (nodeId: string) => void;
  isMenuVisible?: boolean;
};

const getColorClass = (
  chartColor: VideoSourceMenuOption["chartColor"]
): string => {
  if (!chartColor) return "";
  if (chartColor === "red") return "bg-red-500";
  const colorMap = {
    "chart-1": "bg-chart-1",
    "chart-2": "bg-chart-2",
    "chart-3": "bg-chart-3",
    "chart-5": "bg-chart-5",
  } as const;
  return colorMap[chartColor];
};

const FaceSwapVideoSourceMenuBar: React.FC<MenuBarProps> = ({
  options,
  activeOptionId,
  nodeId,
  onOptionClick,
  isMenuVisible,
}) => {
  const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

  const handleOptionClick = useCallback(
    (optionId: string) => {
      if (!nodeId) return;
      const value = optionId as "file" | "youtube";

      const currentConfig = nodeId
        ? useConfigStore.getState().nodeConfigs?.[nodeId]
        : undefined;

      updateNodeConfig(nodeId, {
        ...(currentConfig || {}),
        assets: {
          ...(currentConfig?.assets || {}),
          videoSource: value,
        },
      });
      if (onOptionClick) onOptionClick(nodeId);
    },
    [nodeId, updateNodeConfig, onOptionClick]
  );

  return (
    <div className="flex items-center gap-1.5 rounded-lg p-2 max-w-fit">
      {options.map((option) => {
        const currentConfig = nodeId
          ? useConfigStore.getState().nodeConfigs?.[nodeId]
          : undefined;
        const configVideoSource = currentConfig?.assets?.videoSource;
        const isActive = activeOptionId === option.id;

        if (option.id === "youtube") {
          return (
            <YouTubeButton
              key={option.id}
              isActive={isActive}
              onClickHandler={() => handleOptionClick(option.id)}
              isMenuVisible={isMenuVisible}
              nodeId={nodeId}
            />
          );
        }

        return (
          <div
            key={option.id}
            onClick={() => handleOptionClick(option.id)}
            className={`border flex items-center justify-center gap-1 px-2.5 py-[2px] rounded-xl cursor-pointer transition-colors ${
              activeOptionId === option.id
                ? "bg-accent border-border"
                : "bg-popover border-border hover:bg-accent"
            }`}
          >
            {option.icon ? (
              <Image
                src={option.icon}
                alt={option.label}
                width={20}
                height={20}
              />
            ) : option.showRing ? (
              <div
                className={`size-3 rounded-full flex items-center justify-center transition-colors ${
                  activeOptionId === option.id
                    ? getColorClass(option.chartColor)
                    : `opacity-50 ${getColorClass(option.chartColor)}`
                }`}
              >
                <div
                  className={`size-2 rounded-full transition-colors ${
                    activeOptionId === option.id ? "bg-accent" : "bg-popover"
                  }`}
                />
              </div>
            ) : null}
            <span
              className={`text-caption-desktop-medium ${
                activeOptionId === option.id
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {option.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

FaceSwapVideoSourceMenuBar.displayName = "FaceSwapVideoSourceMenuBar";

export default FaceSwapVideoSourceMenuBar;
