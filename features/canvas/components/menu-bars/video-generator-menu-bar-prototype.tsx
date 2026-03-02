"use client";

import React, { useCallback } from "react";
import useConfigStore from "../../stores/config-store";

export type MenuOption = {
  id: string;
  label: string;
  chartColor: "chart-1" | "chart-2" | "chart-3" | "chart-5";
};

type MenuBarProps = {
  options: MenuOption[];
  activeOptionId?: string;
  nodeId?: string;
  onModeChange?: (optionId: string) => void;
  modeMapping?: Record<string, string>;
  onOptionClick?: (nodeId: string) => void;
};

const getColorClass = (chartColor: MenuOption["chartColor"]): string => {
  const colorMap = {
    "chart-1": "bg-chart-1",
    "chart-2": "bg-chart-2",
    "chart-3": "bg-chart-3",
    "chart-5": "bg-chart-5",
  };
  return colorMap[chartColor];
};

const MenuBar: React.FC<MenuBarProps> = ({
  options,
  activeOptionId,
  nodeId,
  onModeChange,
  modeMapping,
  onOptionClick,
}) => {
  const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

  const handleOptionClick = useCallback(
    (optionId: string) => {
      // Prototype behavior: Always allow mode switching regardless of input connections
      // Handle disabling is controlled by the node component, not the menu bar
      if (nodeId && modeMapping) {
        const newMode = modeMapping[optionId];
        if (newMode) {
          updateNodeConfig(nodeId, { mode: newMode });
        }
      }
      onModeChange?.(optionId);
      if (nodeId && onOptionClick) {
        onOptionClick(nodeId);
      }
    },
    [nodeId, modeMapping, updateNodeConfig, onModeChange, onOptionClick]
  );

  return (
    <div className="flex items-center gap-1.5 rounded-lg p-2 max-w-fit">
      {options.map((option) => (
        <div
          key={option.id}
          onClick={(e) => {
            e.stopPropagation();
            handleOptionClick(option.id);
          }}
          className={`border flex items-center justify-center gap-1 px-2.5 py-[2px] rounded-xl cursor-pointer transition-colors ${
            activeOptionId === option.id
              ? "bg-accent border-border"
              : "bg-popover border-border hover:bg-accent"
          }`}
        >
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
      ))}
    </div>
  );
};

MenuBar.displayName = "MenuBar";

export default MenuBar;
