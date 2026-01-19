import { useMemo } from "react";
import { useConnection } from "@xyflow/react";
import { DataType, NodeFlowConfig } from "../types/sidebar.types";
import useFlowStore from "../stores/canvas-store";

type UseConnectionDisabledStateProps = {
  nodeId: string;
  handleId: string;
  dataType: DataType;
  handleType: "source" | "target";
};

type ConnectionDisabledState = {
  isDisabled: boolean;
  isHighlighted: boolean;
};

export function useConnectionDisabledState({
  nodeId,
  handleId,
  dataType,
  handleType,
}: UseConnectionDisabledStateProps): ConnectionDisabledState {
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

    // Check in uploadedAssets (for upload-node - always source type)
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

  // Memoized calculation of disabled state - bidirectional support
  const isDisabled = useMemo(() => {
    // No active connection - handle is not disabled
    if (!connectionState.isActive || !sourceDataType) {
      return false;
    }

    // Prevent self-connection: disable all handles on the source node except the one being dragged from
    if (connectionState.fromNodeId === nodeId) {
      // Allow only the handle being dragged from
      if (connectionState.fromHandleId === handleId) {
        return false;
      }
      // Disable all other handles on the source node
      return true;
    }

    // Helper to check if this handle can connect to the source handle type
    const canConnect = (fromType: string | undefined, toType: string) => {
      // Source can only connect to Target
      if (fromType === "source" && toType === "target") {
        const canConnect = sourceDataType === dataType;
        return canConnect;
      }
      // Target can only connect to Source (bidirectional)
      if (fromType === "target" && toType === "source") {
        const canConnect = sourceDataType === dataType;
        return canConnect;
      }
      return false;
    };

    // Disable if this handle cannot connect to the drag source
    const result = !canConnect(connectionState.fromHandleType, handleType);
    return result;
  }, [
    connectionState.isActive,
    connectionState.fromNodeId,
    connectionState.fromHandleId,
    connectionState.fromHandleType,
    sourceDataType,
    dataType,
    handleType,
    nodeId,
    handleId,
  ]);

  // Memoized highlight state (inverse of disabled when connection active)
  const isHighlighted = useMemo(() => {
    if (!connectionState.isActive) return false;
    return !isDisabled;
  }, [connectionState.isActive, isDisabled]);

  return { isDisabled, isHighlighted };
}
