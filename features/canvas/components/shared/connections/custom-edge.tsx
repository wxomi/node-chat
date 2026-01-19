"use client";

import React, { type FC, memo, useMemo } from "react";
import {
  BaseEdge,
  getBezierPath,
  type EdgeProps,
  useStore,
} from "@xyflow/react";
import {
  DataType,
  NodeFlowConfig,
  HandleConfig,
} from "../../../types/sidebar.types";

type CustomEdgeProps = EdgeProps & {
  sourceHandle?: string | null;
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

// Helper function to find handle configuration by handle ID from node
const findHandleConfig = (
  node: any,
  handleId: string | null
): HandleConfig | null => {
  if (!handleId) return null;

  // First, check flowConfig for registered handles
  if (node?.data?.flowConfig) {
    const flowConfig = node.data.flowConfig as NodeFlowConfig;
    const allHandles = [...flowConfig.inputs, ...flowConfig.outputs];
    const found = allHandles.find((h: HandleConfig) => h.id === handleId);
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

const CustomEdge: FC<CustomEdgeProps> = memo((props) => {
  const {
    id,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    source,
    selected,
  } = props;

  // Get the edge from the store to access sourceHandle and targetHandle
  const edge = useStore((state) => state.edges.find((e) => e.id === id));

  // Get the source node data from the store
  const sourceNode = useStore((state) =>
    state.nodes.find((node) => node.id === source)
  );

  // Memoize the bezier path calculation
  const edgePath = useMemo(() => {
    const [path] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    return path;
  }, [sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition]);

  // Memoize stroke color calculation based on source handle's data type
  const strokeColor = useMemo(() => {
    const sourceHandle = edge?.sourceHandle || null;
    const handleConfig = findHandleConfig(sourceNode, sourceHandle);
    const dataType = handleConfig?.dataType || "string";
    return getColorValue(dataType);
  }, [sourceNode, edge?.sourceHandle]);

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: strokeColor,
        strokeWidth: selected ? 3 : 1.5,
        strokeLinecap: "round",
        filter: selected ? "brightness(1.4)" : undefined,
      }}
    />
  );
});

CustomEdge.displayName = "CustomEdge";

export default CustomEdge;
