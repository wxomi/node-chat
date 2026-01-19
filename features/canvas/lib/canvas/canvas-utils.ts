import { NodeChange, EdgeChange, Connection, Node, Edge } from "@xyflow/react";
import { NodeFlowConfig } from "../../types/sidebar.types";

/**
 * Determines if a node change is meaningful (should trigger additional logic)
 * Position changes during dragging and dimension changes (resizing) are not considered meaningful
 */
export function isMeaningfulNodeChange(changes: NodeChange[]): boolean {
  return changes.some((change) => {
    switch (change.type) {
      case "add":
      case "remove":
        return true;
      case "select":
      case "position":
      case "dimensions": // Excluded from auto-save
        return false;
      default:
        return false;
    }
  });
}

/**
 * Determines if an edge change is meaningful (should trigger additional logic)
 */
export function isMeaningfulEdgeChange(changes: EdgeChange[]): boolean {
  return changes.some((change) => {
    switch (change.type) {
      case "add":
      case "remove":
      case "select":
        return true;
      default:
        return false;
    }
  });
}

/**
 * Finds nodes in the connection
 */
function findConnectionNodes(
  connection: Connection,
  nodes: Node[]
): { sourceNode: Node | undefined; targetNode: Node | undefined } {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  return { sourceNode, targetNode };
}

/**
 * Validates basic connection rules (nodes exist, not self-connecting)
 */
function validateBasicConnection(
  connection: Connection,
  sourceNode: Node | undefined,
  targetNode: Node | undefined
): boolean {
  if (!sourceNode || !targetNode) {
    return false;
  }

  if (connection.source === connection.target) {
    return false;
  }

  return true;
}

/**
 * Gets the data type for a handle ID from a node
 * Supports both input and output handles
 */
function getHandleDataType(
  node: Node,
  handleId: string | null | undefined,
  checkAsSource: boolean = true
): string | undefined {
  if (!handleId) return undefined;

  const flowConfig = node.data?.flowConfig as NodeFlowConfig | undefined;

  // If checking as source, look in outputs first, then inputs (bidirectional)
  if (checkAsSource) {
    if (flowConfig?.outputs) {
      const handle = flowConfig.outputs.find((h) => h.id === handleId);
      if (handle) {
        return handle.dataType;
      }
    }

    // Check inputs for bidirectional (target->source)
    if (flowConfig?.inputs) {
      const handle = flowConfig.inputs.find((h) => h.id === handleId);
      if (handle) {
        return handle.dataType;
      }
    }
  } else {
    // If checking as target, look in inputs first, then outputs (bidirectional)
    if (flowConfig?.inputs) {
      const handle = flowConfig.inputs.find((h) => h.id === handleId);
      if (handle) {
        return handle.dataType;
      }
    }

    // Check outputs for bidirectional (source->target)
    if (flowConfig?.outputs) {
      const handle = flowConfig.outputs.find((h) => h.id === handleId);
      if (handle) {
        return handle.dataType;
      }
    }
  }

  // Check if it's an asset handle from uploadedAssets (for upload-node)
  if (Array.isArray(node.data?.uploadedAssets)) {
    const asset = node.data.uploadedAssets.find((a: any) => a.id === handleId);
    if (asset) {
      return asset.type; // 'image' | 'video' | 'audio'
    }
  }

  // Check if it's single-upload-node's asset-output handle
  if (node.type === "single-upload-node" && handleId === "asset-output") {
    // Priority: assetType (if uploaded) > expectedDataType (from ghost node) > string (default)
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

    if (assetType) return assetType;
    if (expectedDataType && expectedDataType !== "string")
      return expectedDataType;
    return expectedDataType || "string";
  }

  return undefined;
}

/**
 * Validates that source and target data types match
 */
function validateDataTypeMatch(
  sourceDataType: string | undefined,
  targetDataType: string | undefined,
  sourceNode: Node,
  targetNode: Node
): boolean {
  if (!sourceDataType || !targetDataType) {
    return false;
  }

  if (sourceDataType !== targetDataType) {
    return false;
  }

  return true;
}

/**
 * Validates if a connection between two handles is valid based on data type matching
 * and enforces connection limits per handle
 * Supports bidirectional connections and prevents self-connections
 */
export function isValidConnection(
  connection: Connection,
  nodes: Node[],
  edges: Edge[] = []
): boolean {
  // Step 1: Find nodes
  const { sourceNode, targetNode } = findConnectionNodes(connection, nodes);

  // Step 2: Validate basic rules
  if (!validateBasicConnection(connection, sourceNode, targetNode)) {
    return false;
  }

  // Step 3: Get source data type
  const sourceDataType = getHandleDataType(
    sourceNode!,
    connection.sourceHandle,
    true
  );

  // Step 4: Get target data type
  const targetDataType = getHandleDataType(
    targetNode!,
    connection.targetHandle,
    false
  );

  // Step 5: Validate data type match
  if (
    !validateDataTypeMatch(
      sourceDataType,
      targetDataType,
      sourceNode!,
      targetNode!
    )
  ) {
    return false;
  }

  // Step 6: Validate max connections
  const targetFlowConfig = targetNode!.data?.flowConfig as
    | NodeFlowConfig
    | undefined;

  if (targetFlowConfig?.inputs && connection.targetHandle) {
    const targetHandle = targetFlowConfig.inputs.find(
      (h) => h.id === connection.targetHandle
    );

    const maxConnections = targetHandle?.maxConnections;

    if (maxConnections !== undefined && maxConnections > 0) {
      // Check if this is a reconnection (edge already exists on target handle with same source/handles)
      const isReconnection = edges.some(
        (edge) =>
          edge.targetHandle === connection.targetHandle &&
          edge.target === connection.target &&
          edge.source === connection.source &&
          edge.sourceHandle === connection.sourceHandle
      );

      // Count existing connections
      const currentConnections = edges.filter(
        (edge) =>
          edge.targetHandle === connection.targetHandle &&
          edge.target === connection.target
      ).length;

      // If we're at max connections and this isn't a reconnection
      if (!isReconnection && currentConnections >= maxConnections) {
        // Allow the connection to proceed - onConnect will handle replacement
        // We've already validated data types, nodes exist, etc. in previous steps
        // So if we get here, the connection is valid - just at max limit

        return true;
      }
    }
  }

  return true;
}

/**
 * Determines why a connection is invalid and returns a user-friendly error message
 */
export function getConnectionErrorMessage(
  connection: Connection,
  nodes: Node[],
  edges: Edge[]
): string {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) {
    return "Invalid nodes";
  }

  if (connection.source === connection.target) {
    return "Cannot connect node to itself";
  }

  const sourceFlowConfig = sourceNode.data?.flowConfig as NodeFlowConfig;
  const targetFlowConfig = targetNode.data?.flowConfig as NodeFlowConfig;

  // Check data type mismatch
  let sourceDataType: string | undefined;
  if (sourceFlowConfig?.outputs) {
    const handle = sourceFlowConfig.outputs.find(
      (h) => h.id === connection.sourceHandle
    );
    sourceDataType = handle?.dataType;
  }

  let targetDataType: string | undefined;
  if (targetFlowConfig?.inputs) {
    const handle = targetFlowConfig.inputs.find(
      (h) => h.id === connection.targetHandle
    );
    targetDataType = handle?.dataType;
  }

  if (sourceDataType && targetDataType && sourceDataType !== targetDataType) {
    return "Incompatible data types";
  }

  // Check max connections
  if (targetFlowConfig?.inputs && connection.targetHandle) {
    const targetHandle = targetFlowConfig.inputs.find(
      (h) => h.id === connection.targetHandle
    );

    const maxConnections = targetHandle?.maxConnections;

    if (maxConnections !== undefined && maxConnections > 0) {
      const isReconnection = edges.some(
        (edge) =>
          edge.targetHandle === connection.targetHandle &&
          edge.target === connection.target
      );

      const currentConnections = edges.filter(
        (edge) =>
          edge.targetHandle === connection.targetHandle &&
          edge.target === connection.target
      ).length;

      if (!isReconnection && currentConnections >= maxConnections) {
        return `Maximum ${maxConnections} connection${
          maxConnections > 1 ? "s" : ""
        } allowed for this handle`;
      }
    }
  }

  return "Invalid connection";
}

/**
 * Retrieves the connected asset from an upload node using the edge's sourceHandle
 * Handles both upload-node assets and generated node data (imageDetails, audioDetails, videoDetails)
 */
export function getConnectedAssetUrl(
  sourceNode: Node | undefined,
  edge: {
    source: string;
    sourceHandle: string | null | undefined;
    target: string;
  }
): { url: string; assetInfo: any } | null {
  if (!sourceNode || !edge.sourceHandle) {
    return null;
  }

  // Check if this is an upload-node with uploadedAssets
  if (sourceNode.type === "upload-node" && sourceNode.data?.uploadedAssets) {
    const uploadedAssets = sourceNode.data.uploadedAssets as Array<{
      id: string;
      type: "image" | "video" | "audio";
      fileName: string;
      previewUrl: string;
      filePath: string;
      isUploading?: boolean;
    }>;

    const asset = uploadedAssets.find((a) => a.id === edge.sourceHandle);

    if (asset) {
      // If filePath is empty, try to get it from node data Details objects
      if (!asset.filePath) {
        // Try type-specific Details objects first
        let detailsUrl: string | undefined;

        if (asset.type === "image") {
          detailsUrl = (sourceNode.data?.imageDetails as any)?.downloads?.[0]
            ?.url;
        } else if (asset.type === "video") {
          detailsUrl = (sourceNode.data?.videoDetails as any)?.downloads?.[0]
            ?.url;
        } else if (asset.type === "audio") {
          detailsUrl = (sourceNode.data?.audioDetails as any)?.downloads?.[0]
            ?.url;
        }

        if (detailsUrl) {
          return {
            url: detailsUrl,
            assetInfo: {
              type: asset.type,
              fileName: asset.fileName,
              previewUrl: asset.previewUrl,
              id: asset.id,
            },
          };
        }
      }

      // If filePath is empty but upload is complete, try to get it from node data
      if (!asset.filePath && !asset.isUploading) {
        const filePathFromNodeData =
          (sourceNode.data?.imageDetails as any)?.downloads?.[0]?.url ||
          (sourceNode.data?.audioDetails as any)?.downloads?.[0]?.url ||
          (sourceNode.data?.videoDetails as any)?.downloads?.[0]?.url ||
          (sourceNode.data?.filePath as string | undefined);

        // Additional check: try to find matching Details object by type
        if (!filePathFromNodeData && asset.type === "image") {
          const detailsUrl = (sourceNode.data?.imageDetails as any)
            ?.downloads?.[0]?.url;
          if (detailsUrl) {
            return {
              url: detailsUrl,
              assetInfo: {
                type: asset.type,
                fileName: asset.fileName,
                previewUrl: asset.previewUrl,
                id: asset.id,
              },
            };
          }
        }
        if (!filePathFromNodeData && asset.type === "video") {
          const detailsUrl = (sourceNode.data?.videoDetails as any)
            ?.downloads?.[0]?.url;
          if (detailsUrl) {
            return {
              url: detailsUrl,
              assetInfo: {
                type: asset.type,
                fileName: asset.fileName,
                previewUrl: asset.previewUrl,
                id: asset.id,
              },
            };
          }
        }
        if (!filePathFromNodeData && asset.type === "audio") {
          const detailsUrl = (sourceNode.data?.audioDetails as any)
            ?.downloads?.[0]?.url;
          if (detailsUrl) {
            return {
              url: detailsUrl,
              assetInfo: {
                type: asset.type,
                fileName: asset.fileName,
                previewUrl: asset.previewUrl,
                id: asset.id,
              },
            };
          }
        }

        if (filePathFromNodeData) {
          return {
            url: filePathFromNodeData,
            assetInfo: {
              type: asset.type,
              fileName: asset.fileName,
              previewUrl: asset.previewUrl,
              id: asset.id,
            },
          };
        }
      }

      return {
        url: asset.filePath,
        assetInfo: {
          type: asset.type,
          fileName: asset.fileName,
          previewUrl: asset.previewUrl,
          id: asset.id,
        },
      };
    }

    return null;
  }

  // Fallback: try to get URL from imageDetails, audioDetails, or videoDetails
  const imageUrl = (sourceNode.data?.imageDetails as any)?.downloads?.[0]?.url;
  if (imageUrl) {
    return {
      url: imageUrl,
      assetInfo: { type: "image" },
    };
  }

  const audioUrl = (sourceNode.data?.audioDetails as any)?.downloads?.[0]?.url;
  if (audioUrl) {
    return {
      url: audioUrl,
      assetInfo: { type: "audio" },
    };
  }

  const videoUrl = (sourceNode.data?.videoDetails as any)?.downloads?.[0]?.url;
  if (videoUrl) {
    return {
      url: videoUrl,
      assetInfo: { type: "video" },
    };
  }

  return null;
}
