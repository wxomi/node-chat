"use client";

import React, { type FC, memo, useMemo } from "react";
import {
  getBezierPath,
  type ConnectionLineComponentProps,
} from "@xyflow/react";
import {
  HandleConfig,
  DataType,
  NodeFlowConfig,
} from "../../../types/sidebar.types";

type ExtendedConnectionLineProps = ConnectionLineComponentProps & {
  fromHandle?: { id?: string };
  toHandle?: { id?: string };
};

// Function to get CSS custom property based on data type
const getColorValue = (dataType: DataType): string => {
  const colorMap: Record<DataType, string> = {
    string: "var(--chart-1)", // Prompt/text - Purple
    image: "var(--chart-2)", // Image - Green
    video: "var(--chart-5)", // Video - Red
    audio: "var(--chart-3)", // Audio - Orange
  };
  return colorMap[dataType];
};

// Helper function to find handle configuration by handle ID
const findHandleConfig = (
  node: ConnectionLineComponentProps["fromNode"],
  handleId: string | null
): HandleConfig | null => {
  if (!handleId) return null;

  // First, check flowConfig for registered handles
  if (node?.data?.flowConfig) {
    const flowConfig = node.data.flowConfig as NodeFlowConfig;
    const allHandles = [...flowConfig.inputs, ...flowConfig.outputs];
    const found = allHandles.find(
      (handle: HandleConfig) => handle.id === handleId
    );
    if (found) return found;
  }

  // For upload-node, check if this is an asset handle
  // Asset handles have their type stored in uploadedAssets
  if (node?.data?.uploadedAssets) {
    const uploadedAssets = node.data.uploadedAssets as Array<{
      id: string;
      type: "image" | "video" | "audio";
    }>;
    const asset = uploadedAssets.find((a) => a.id === handleId);
    if (asset) {
      // Return a minimal HandleConfig with the asset's dataType
      return {
        id: handleId,
        type: "source",
        dataType: asset.type,
        position: "right",
      };
    }
  }

  // For single-upload-node, check if this is the asset-output handle
  // Priority: assetType (if uploaded) > expectedDataType (from ghost node) > string (default)
  if (node?.type === "single-upload-node" && handleId === "asset-output") {
    const assetType = node.data?.assetType as
      | "image"
      | "video"
      | "audio"
      | null
      | undefined;
    const expectedDataType = node.data?.expectedDataType as
      | "image"
      | "video"
      | "audio"
      | "string"
      | null
      | undefined;

    const dataType =
      assetType ||
      (expectedDataType && expectedDataType !== "string"
        ? expectedDataType
        : "string");

    return {
      id: handleId,
      type: "source",
      dataType,
      position: "right",
    };
  }

  return null;
};

const CustomConnectionLine: FC<ConnectionLineComponentProps> = memo((props) => {
  const { fromX, fromY, toX, toY, fromPosition, toPosition, connectionStatus } =
    props;

  // Handle objects (may not be in official types yet)
  const { fromHandle, toHandle } = props as ExtendedConnectionLineProps;

  // Memoize the expensive bezier path calculation
  const edgePath = useMemo(() => {
    const [path] = getBezierPath({
      sourceX: fromX,
      sourceY: fromY,
      sourcePosition: fromPosition,
      targetX: toX,
      targetY: toY,
      targetPosition: toPosition,
    });
    return path;
  }, [fromX, fromY, fromPosition, toX, toY, toPosition]);

  // Memoize stroke color calculation - only when source handle changes
  const strokeColor = useMemo(() => {
    const sourceHandleConfig = findHandleConfig(
      props.fromNode,
      fromHandle?.id || null
    );
    const dataType = sourceHandleConfig?.dataType || "string";
    return getColorValue(dataType);
  }, [props.fromNode, fromHandle?.id]);

  return (
    <g>
      <path
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        d={edgePath}
        style={{
          opacity: 1,
          stroke: strokeColor,
        }}
      />
    </g>
  );
});

CustomConnectionLine.displayName = "CustomConnectionLine";

export default CustomConnectionLine;
