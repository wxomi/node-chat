import React, { useEffect, useMemo, memo } from "react";
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
import { useIsStepActive } from "../../../stores/walkthrough-store";

type CustomHandleProps = {
  config: HandleConfig;
  isConnected?: boolean;
  onSelected?: boolean;
  position?: Position;
  style?: React.CSSProperties;
  className?: string;
  nodeId?: string;
  isRequired?: boolean;
  isHovered?: boolean;
  // Add these new props for structured positioning
  index?: number;
  handleType?: "input" | "output";
  baseOffset?: number; // Default starting position
  spacing?: number; // Distance between handles
  disabled?: boolean; // Whether handle is disabled
  labelOffset?: { top?: string | number; horizontal?: string | number }; // Offset for label positioning
  labelOffsets?: Record<
    string,
    { top?: string | number; horizontal?: string | number }
  >; // Map of label names to offsets
  backgroundColor?: string; // Optional override for handle background color
  // walkthrough highlighting
  isWalkthrough?: boolean;
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
  const colorMap = {
    string: "var(--chart-1)", // Prompt/text - Purple
    image: "var(--chart-2)", // Image - Green
    video: "var(--chart-5)", // Video - Red
    audio: "var(--chart-3)", // Audio - Orange
  };
  return colorMap[dataType];
};

const CustomHandle: React.FC<CustomHandleProps> = memo(
  ({
    config,
    isConnected = false,
    onSelected = false,
    position,
    style,
    className,
    nodeId,
    index = 0,
    handleType = "output",
    baseOffset = 50,
    spacing = 40,
    isRequired = false,
    isHovered = false,
    disabled = false,
    labelOffset,
    labelOffsets,
    backgroundColor,
    isWalkthrough = false,
  }) => {
    const updateNodeInternals = useUpdateNodeInternals();
    // Only subscribe to step 5 if isWalkthrough is true (performance optimization)
    const isStep5Active = useIsStepActive(5);
    const shouldGlow = useMemo(
      () => isWalkthrough && isStep5Active,
      [isWalkthrough, isStep5Active]
    );

    // Get current connections to this handle
    const connections = useNodeConnections({
      handleType: config.type,
      handleId: config.id,
    });

    // Calculate if handle is connectable based on max connections
    // useMemo prevents recalculation unless connections actually change
    const isConnectable = useMemo(() => {
      if (config.maxConnections === undefined) return true; // No limit
      // Always allow connections - onConnect will handle replacement when at max
      // This allows the connection to proceed so replacement logic can work
      return true;
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

    // Calculate position based on index
    const calculatedTop = baseOffset + index * spacing;

    // Merge calculated positioning with any custom style
    // If style.top is provided, use it; otherwise use calculated top
    const mergedStyle = {
      ...style,
      top: style?.top !== undefined ? style.top : calculatedTop,
    };

    // Memoize chart color - use override if provided, otherwise use default
    const chartColor = useMemo(
      () => backgroundColor || getChartColor(config.dataType),
      [config.dataType, backgroundColor]
    );

    // Memoize connection state check using the selector
    const isConnectingToThisHandle = useMemo(() => {
      if (!connectionState) return false;

      return (
        (handleType === "output" &&
          connectionState.fromNodeId === nodeId &&
          connectionState.fromHandleId === config.id) ||
        (handleType === "input" &&
          connectionState.toNodeId === nodeId &&
          connectionState.toHandleId === config.id)
      );
    }, [connectionState, handleType, nodeId, config.id]);

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

      // When dragging from SOURCE: show labels only for TARGET handles
      if (
        connectionState.fromHandleType === "source" &&
        config.type === "target"
      ) {
        return true;
      }

      // When dragging from TARGET: show labels only for SOURCE handles (bidirectional)
      if (
        connectionState.fromHandleType === "target" &&
        config.type === "source"
      ) {
        return true;
      }

      return false;
    }, [
      onSelected,
      isHovered,
      connectionState.isActive,
      connectionState.fromHandleType,
      finalDisabled,
      config.type,
    ]);

    // Update node internals when handle is rendered with custom positioning
    useEffect(() => {
      if (nodeId && (mergedStyle || position)) {
        updateNodeInternals(nodeId);
      }
    }, [nodeId, mergedStyle, position, updateNodeInternals]);

    return (
      <Handle
        id={config.id}
        type={config.type}
        position={handlePosition}
        style={mergedStyle}
        className={cn(
          "!bg-popover !border-none !size-5 !items-center !justify-center !flex",
          onSelected && "!bg-[#1e1f32]",
          finalDisabled && "cursor-not-allowed",
          className
        )}
        data-disabled={finalDisabled}
        isConnectable={isConnectable}
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
            } ${
              shouldGlow
                ? "ring-2 ring-purple-400 ring-opacity-75 shadow-lg shadow-purple-400/50 animate-pulse"
                : ""
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
              "absolute text-[12px] font-medium transition-opacity duration-150",
              showLabel ? "opacity-100" : "opacity-0"
            )}
            style={{
              color: chartColor,
              top:
                labelOffsets?.[config.label]?.top !== undefined
                  ? labelOffsets[config.label].top
                  : labelOffset?.top !== undefined
                  ? labelOffset.top
                  : "-1.2rem",
              [handleType === "input" ? "left" : "right"]:
                labelOffsets?.[config.label]?.horizontal !== undefined
                  ? labelOffsets[config.label].horizontal
                  : labelOffset?.horizontal !== undefined
                  ? labelOffset.horizontal
                  : "-2rem",
            }}
          >
            {config.label}
            {handleType === "input" && (config.required || isRequired) && (
              <span>*</span>
            )}
          </div>
        )}
      </Handle>
    );
  }
);

CustomHandle.displayName = "CustomHandle";

export default CustomHandle;
