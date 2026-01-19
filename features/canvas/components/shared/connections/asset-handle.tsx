"use client";

import React, { useEffect, useMemo, memo, useCallback } from "react";
import {
  Handle,
  Position,
  useUpdateNodeInternals,
  useConnection,
  useNodeConnections,
} from "@xyflow/react";
import { HandleConfig } from "../../../types/sidebar.types";
import { cn } from "@/lib/utils";
import { useConnectionDisabledState } from "../../../hooks/use-connection-disabled-state";

type AssetHandleProps = {
  config: HandleConfig;
  isConnected?: boolean;
  onSelected?: boolean;
  position?: Position;
  style?: React.CSSProperties;
  className?: string;
  nodeId?: string;
  isRequired?: boolean;
  isHovered?: boolean;
  disabled?: boolean;
  labelOffset?: { top?: string | number; horizontal?: string | number };
  labelOffsets?: Record<
    string,
    { top?: string | number; horizontal?: string | number }
  >;
  // Asset-specific props
  assetId?: string;
  positionMode?: "absolute" | "relative";
  top?: string | number;
  offset?: string | number;
};

const getPosition = (position: HandleConfig["position"]): Position => {
  const positions = {
    top: Position.Top,
    bottom: Position.Bottom,
    left: Position.Left,
    right: Position.Right,
  };
  return positions[position];
};

// Function to get chart color based on data type
const getChartColor = (dataType: HandleConfig["dataType"]): string => {
  const colorMap: Record<string, string> = {
    string: "var(--chart-1)", // Prompt/text - Purple
    image: "var(--chart-2)", // Image - Green
    video: "var(--chart-5)", // Video - Red
    audio: "var(--chart-3)", // Audio - Orange
  };
  return colorMap[dataType] || "var(--chart-2)"; // Fallback to green
};

const AssetHandle: React.FC<AssetHandleProps> = memo(
  ({
    config,
    isConnected = false,
    onSelected = false,
    position,
    style,
    className,
    nodeId,
    isRequired = false,
    isHovered = false,
    disabled = false,
    labelOffset,
    labelOffsets,
    assetId,
    positionMode = "relative",
    top,
    offset,
  }) => {
    const updateNodeInternals = useUpdateNodeInternals();

    // Get current connections to this handle
    const connections = useNodeConnections({
      handleType: config.type,
      handleId: config.id,
    });

    // Calculate if handle is connectable based on max connections
    // useMemo prevents recalculation unless connections actually change
    const isConnectable = useMemo(() => {
      if (config.maxConnections === undefined) return true; // No limit
      return connections.length < config.maxConnections;
    }, [connections.length, config.maxConnections]);

    // Use selector to only subscribe to specific connection state properties
    const connectionState = useConnection((connection) => ({
      fromNodeId: connection?.fromNode?.id,
      fromHandleId: connection?.fromHandle?.id,
      toNodeId: connection?.toNode?.id,
      toHandleId: connection?.toHandle?.id,
      isActive: !!connection?.fromNode,
      fromHandleType: connection?.fromHandle?.type,
    }));

    // Get dynamic disabled state based on connection type matching
    const { isDisabled: connectionBasedDisabled } = useConnectionDisabledState({
      nodeId: nodeId || "",
      handleId: config.id,
      dataType: config.dataType,
      handleType: config.type,
    });

    // Merge both disabled states: connection-based takes priority when connection is active
    const finalDisabled = connectionState.isActive
      ? connectionBasedDisabled
      : disabled;

    // Memoize chart color
    const chartColor = useMemo(
      () => getChartColor(config.dataType),
      [config.dataType]
    );

    // Memoize connection state check using the selector
    const isConnectingToThisHandle = useMemo(() => {
      if (!connectionState) return false;

      return (
        connectionState.fromNodeId === nodeId &&
        connectionState.fromHandleId === config.id
      );
    }, [connectionState, nodeId, config.id]);

    // Get handle position
    const handlePosition = position || getPosition(config.position);

    // Calculate inner circle visibility
    const showInnerCircle = isConnected || isConnectingToThisHandle;

    // Memoize label visibility: show for selected/hovered OR for compatible handles during active connection
    const showLabel = useMemo(() => {
      // Keep existing behavior: show if selected or hovered
      if (onSelected || isHovered) return true;

      // During active connection, show labels for compatible handles based on drag source type
      if (!connectionState.isActive || finalDisabled) return false;

      // Asset handles are always SOURCE type, so show labels when TARGET is being dragged (bidirectional)
      if (connectionState.fromHandleType === "target") {
        return true;
      }

      return false;
    }, [
      onSelected,
      isHovered,
      connectionState.isActive,
      connectionState.fromHandleType,
      finalDisabled,
    ]);

    // Update node internals when handle is rendered with custom positioning
    useEffect(() => {
      if (nodeId && positionMode === "absolute") {
        updateNodeInternals(nodeId);
      }
    }, [nodeId, positionMode, updateNodeInternals]);

    // Handle click to prevent propagation
    const handleClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    // For relative positioning, render a custom div instead of React Flow Handle
    if (positionMode === "relative") {
      return (
        <Handle
          id={config.id}
          type={config.type}
          position={Position.Right}
          className="!bg-transparent !border-none !p-0 !flex !items-center !justify-center"
          style={{ width: "20px", height: "20px" }}
          isConnectable={isConnectable}
        >
          <div
            className={cn(
              "relative cursor-pointer",
              finalDisabled && "cursor-not-allowed",
              className
            )}
            data-disabled={finalDisabled}
          >
            <div
              className={cn(
                "size-5 flex items-center justify-center",
                finalDisabled && "opacity-50"
              )}
            >
              <div
                className={cn(
                  `size-3 rounded-full flex items-center justify-center border-2`,
                  finalDisabled && "opacity-50"
                )}
                style={{
                  borderColor: chartColor,
                  backgroundColor: "transparent",
                }}
              >
                {showInnerCircle && (
                  <div
                    className={`size-1 rounded-full ${
                      finalDisabled ? "opacity-50" : ""
                    }`}
                    style={{
                      backgroundColor: chartColor,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </Handle>
      );
    }

    // For absolute positioning, use React Flow Handle
    return (
      <Handle
        id={config.id}
        type={config.type}
        position={handlePosition}
        style={{
          ...style,
          top: top || style?.top,
          right: offset || style?.right,
          width: "20px",
          height: "20px",
        }}
        className={cn(
          "!bg-popover !border-none !size-5 !items-center !justify-center !flex",
          onSelected && "!bg-[#1e1f32]",
          finalDisabled && "cursor-not-allowed",
          className
        )}
        data-disabled={finalDisabled}
        isConnectable={(config.maxConnections ?? true) as any}
      >
        <div
          className={`size-3 rounded-full flex items-center justify-center ${
            finalDisabled ? "opacity-50" : ""
          }`}
          style={{
            backgroundColor: chartColor,
          }}
        >
          <div
            className={`bg-popover size-2 rounded-full flex items-center justify-center ${
              finalDisabled ? "opacity-50" : ""
            }`}
          >
            {showInnerCircle && (
              <div
                className={`size-1 rounded-full ${
                  finalDisabled ? "opacity-50" : ""
                }`}
                style={{
                  backgroundColor: chartColor,
                }}
              />
            )}
          </div>
        </div>
        {config.label && (
          <div
            className={cn(
              "absolute text-[8px] font-medium transition-opacity duration-150",
              showLabel ? "opacity-100" : "opacity-0"
            )}
            style={{
              color: chartColor,
              top:
                labelOffsets?.[config.label]?.top !== undefined
                  ? labelOffsets[config.label].top
                  : labelOffset?.top !== undefined
                  ? labelOffset.top
                  : "-0.75rem",
              right:
                labelOffsets?.[config.label]?.horizontal !== undefined
                  ? labelOffsets[config.label].horizontal
                  : labelOffset?.horizontal !== undefined
                  ? labelOffset.horizontal
                  : "-2rem",
            }}
          >
            {config.label}
          </div>
        )}
      </Handle>
    );
  }
);

AssetHandle.displayName = "AssetHandle";

export default AssetHandle;
