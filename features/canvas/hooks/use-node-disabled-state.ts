import { useMemo } from "react";
import { useConnection } from "@xyflow/react";
import { NodeFlowConfig } from "../types/sidebar.types";
import useFlowStore from "../stores/canvas-store";

type UseNodeDisabledStateProps = {
  nodeId: string;
  flowConfig: NodeFlowConfig | null;
};

type NodeDisabledState = {
  isNodeDisabled: boolean;
};

export function useNodeDisabledState({
  nodeId,
  flowConfig,
}: UseNodeDisabledStateProps): NodeDisabledState {
  // Extract minimal connection state using selector - now includes fromHandleType for bidirectional support
  const connectionState = useConnection((connection) => ({
    fromNodeId: connection?.fromNode?.id,
    fromHandleId: connection?.fromHandle?.id,
    isActive: !!connection?.fromNode,
    fromHandleType: connection?.fromHandle?.type,
  }));

  // Get source data type when connection is active
  const sourceDataType = useMemo(() => {
    if (!connectionState.isActive || !connectionState.fromNodeId) return null;

    const sourceNode = useFlowStore
      .getState()
      .nodes.find((n) => n.id === connectionState.fromNodeId);

    if (!sourceNode) return null;

    const sourceFlowConfig = sourceNode.data?.flowConfig as
      | NodeFlowConfig
      | undefined;

    // If dragging from SOURCE handle: look in outputs
    if (
      connectionState.fromHandleType === "source" &&
      sourceFlowConfig?.outputs
    ) {
      const sourceHandle = sourceFlowConfig.outputs.find(
        (h) => h.id === connectionState.fromHandleId
      );
      if (sourceHandle) {
        return sourceHandle.dataType;
      }
    }

    // If dragging from TARGET handle: look in inputs (bidirectional)
    if (
      connectionState.fromHandleType === "target" &&
      sourceFlowConfig?.inputs
    ) {
      const sourceHandle = sourceFlowConfig.inputs.find(
        (h) => h.id === connectionState.fromHandleId
      );
      if (sourceHandle) {
        return sourceHandle.dataType;
      }
    }

    // Check in uploadedAssets (for upload-node)
    if (Array.isArray(sourceNode.data?.uploadedAssets)) {
      const asset = sourceNode.data.uploadedAssets.find(
        (a: any) => a.id === connectionState.fromHandleId
      );
      if (asset) {
        return asset.type;
      }
    }

    return null;
  }, [
    connectionState.fromNodeId,
    connectionState.fromHandleId,
    connectionState.isActive,
    connectionState.fromHandleType,
  ]);

  // Memoized node disabled state - bidirectional support
  const isNodeDisabled = useMemo(() => {
    // No active connection - node is not disabled
    if (!connectionState.isActive || !sourceDataType) {
      return false;
    }

    // Don't disable source node (the one being dragged from) - it can have connections from others
    if (connectionState.fromNodeId === nodeId) {
      return false;
    }

    if (!flowConfig) {
      return false;
    }

    // Dragging FROM a SOURCE handle: check for compatible TARGET inputs
    if (connectionState.fromHandleType === "source") {
      const hasCompatibleHandle = flowConfig.inputs.some(
        (input) => input.dataType === sourceDataType
      );
      return !hasCompatibleHandle;
    }

    // Dragging FROM a TARGET handle: check for compatible SOURCE outputs (bidirectional)
    if (connectionState.fromHandleType === "target") {
      const hasCompatibleHandle = flowConfig.outputs.some(
        (output) => output.dataType === sourceDataType
      );

      // Also check uploadedAssets on the CURRENT node (not source node) - for upload-node (dynamic source handles)
      const currentNode = useFlowStore
        .getState()
        .nodes.find((n) => n.id === nodeId);

      const hasCompatibleAsset =
        Array.isArray(currentNode?.data?.uploadedAssets) &&
        (currentNode?.data?.uploadedAssets as any[]).some(
          (asset: any) => asset.type === sourceDataType
        );

      return !(hasCompatibleHandle || hasCompatibleAsset);
    }

    return false;
  }, [
    connectionState.isActive,
    connectionState.fromNodeId,
    connectionState.fromHandleType,
    sourceDataType,
    flowConfig,
    nodeId,
  ]);

  return { isNodeDisabled };
}
