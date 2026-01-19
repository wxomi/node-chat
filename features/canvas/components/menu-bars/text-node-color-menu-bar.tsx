"use client";

import React, { useCallback, useMemo, memo } from "react";
import useConfigStore from "../../stores/config-store";
import { cn } from "@/lib/utils";

export type ColorOption = {
  id: string;
  hex: string;
  textHex: string;
  label?: string;
};

const COLOR_OPTIONS: ColorOption[] = [
  { id: "yellow", hex: "#fef08a", textHex: "#1a1b28", label: "Yellow" },
  { id: "pink", hex: "#fda4af", textHex: "#1a1b28", label: "Pink" },
  { id: "blue", hex: "#93c5fd", textHex: "#1a1b28", label: "Blue" },
  { id: "green", hex: "#86efac", textHex: "#1a1b28", label: "Green" },
  { id: "orange", hex: "#fdba74", textHex: "#1a1b28", label: "Orange" },
  { id: "purple", hex: "#c084fc", textHex: "#1a1b28", label: "Purple" },
  { id: "chart-5", hex: "#d81b5d", textHex: "#ffffff", label: "Pink" },
];

const DEFAULT_COLOR = "#c084fc"; // Purple

/**
 * Calculate text color based on background color luminance
 * Returns white for dark backgrounds, dark for light backgrounds
 */
const calculateTextColor = (hexColor: string): string => {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white for dark backgrounds, dark for light backgrounds
  return luminance < 0.5 ? "#ffffff" : "#1a1b28";
};

type TextNodeColorMenuBarProps = {
  nodeId: string;
  activeColorId?: string;
  isMenuVisible?: boolean;
};

const TextNodeColorMenuBar: React.FC<TextNodeColorMenuBarProps> = memo(
  ({ nodeId, activeColorId, isMenuVisible }) => {
    const updateNodeConfig = useConfigStore((state) => state.updateNodeConfig);

    // Get current color from config store
    const currentColor = useConfigStore(
      (state) => state.nodeConfigs?.[nodeId]?.color ?? DEFAULT_COLOR
    );

    // Find active color option based on current color
    const activeColor = useMemo(() => {
      if (activeColorId) {
        return COLOR_OPTIONS.find((option) => option.id === activeColorId);
      }
      return (
        COLOR_OPTIONS.find((option) => option.hex === currentColor) ||
        COLOR_OPTIONS[0]
      );
    }, [activeColorId, currentColor]);

    // Get text color for current color (for accessibility)
    const textColor = useMemo(() => {
      return activeColor?.textHex || "#1a1b28";
    }, [activeColor]);

    const handleColorClick = useCallback(
      (colorOption: ColorOption) => {
        if (!nodeId) return;

        updateNodeConfig(nodeId, {
          color: colorOption.hex,
        });
      },
      [nodeId, updateNodeConfig]
    );

    if (!isMenuVisible) {
      return null;
    }

    return (
      <div className="flex items-center gap-2 rounded-lg py-1 px-2 bg-popover border border-border">
        {COLOR_OPTIONS.map((colorOption) => {
          const isActive = activeColor?.id === colorOption.id;

          return (
            <button
              key={colorOption.id}
              onClick={() => handleColorClick(colorOption)}
              className={cn(
                "size-3 rounded-full cursor-pointer",
                isActive
                  ? "border-foreground ring-1 ring-foreground/20"
                  : "border-border hover:border-foreground/50"
              )}
              style={{
                backgroundColor: colorOption.hex,
              }}
              title={colorOption.label || colorOption.id}
              aria-label={`Select ${colorOption.label || colorOption.id} color`}
            />
          );
        })}
      </div>
    );
  }
);

TextNodeColorMenuBar.displayName = "TextNodeColorMenuBar";

export default TextNodeColorMenuBar;
export { calculateTextColor, DEFAULT_COLOR, COLOR_OPTIONS };
