import {
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  ReactFlowInstance,
} from "@xyflow/react";
import { create } from "zustand";
import { nanoid } from "nanoid";
import {
  isMeaningfulNodeChange,
  isMeaningfulEdgeChange,
  isValidConnection,
} from "../lib/canvas";
import {
  getNodeFlowConfig,
  getAllPreviewSections,
} from "../constants/nodes/preview-nodes";
import useConfigStore from "./config-store";
import { NodeFlowConfig } from "../types/sidebar.types";
import { triggerCanvasSave } from "../lib/canvas";
import useCanvasMetadataStore from "./canvas-metadata-store";
import useClipboardStore from "./clipboard-store";

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  rfInstance: ReactFlowInstance | null;
  reconnectingEdgeId: string | null;
  connectionMenuOpen: boolean;
  connectionMenuPosition: { x: number; y: number } | null;
  connectionSourceInfo: {
    sourceNodeId: string | null;
    sourceHandleId: string | null;
    targetNodeId: string | null;
    targetHandleId: string | null;
    handleType: "source" | "target" | null;
  };
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onReconnect: (oldEdge: Edge, connection: Connection) => void;
  addNode: (
    type: string,
    position: { x: number; y: number },
    data?: any
  ) => string;
  addNodeAfter: (
    nodeType: string,
    afterNodeId: string,
    offsetX?: number,
    offsetY?: number
  ) => string | null;
  addNodeBefore: (
    nodeType: string,
    beforeNodeId: string,
    offsetX?: number,
    offsetY?: number,
    targetInputHandleId?: string,
    targetInputDataType?: string,
    initialData?: any
  ) => string | null;
  addNodeAtPositionAndConnect: (
    nodeType: string,
    position: { x: number; y: number },
    sourceNodeId: string,
    sourceHandleId?: string | null
  ) => string | null;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<any>) => void;
  updateNodeDimensions: (
    nodeId: string,
    width?: number,
    height?: number
  ) => void;
  resetFlow: () => void;
  setRfInstance: (instance: ReactFlowInstance | null) => void;
  setReconnectingEdgeId: (edgeId: string | null) => void;
  setConnectionMenuOpen: (open: boolean) => void;
  setConnectionMenuPosition: (
    position: { x: number; y: number } | null
  ) => void;
  setConnectionSourceInfo: (info: {
    sourceNodeId: string | null;
    sourceHandleId: string | null;
    targetNodeId?: string | null;
    targetHandleId?: string | null;
    handleType?: "source" | "target" | null;
  }) => void;
  addNodeAtPositionAndConnectToTarget: (
    nodeType: string,
    position: { x: number; y: number },
    targetNodeId: string,
    targetHandleId: string | null
  ) => string | null;
  selectNode: (nodeId: string) => void;
}

const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  rfInstance: null,
  reconnectingEdgeId: null,
  connectionMenuOpen: false,
  connectionMenuPosition: null,
  connectionSourceInfo: {
    sourceNodeId: null,
    sourceHandleId: null,
    targetNodeId: null,
    targetHandleId: null,
    handleType: null,
  },
  setRfInstance: (instance: ReactFlowInstance | null) => {
    set({ rfInstance: instance });
  },

  setReconnectingEdgeId: (edgeId: string | null) => {
    set({ reconnectingEdgeId: edgeId });
  },

  setConnectionMenuOpen: (open: boolean) => {
    set({ connectionMenuOpen: open });
  },

  setConnectionMenuPosition: (position: { x: number; y: number } | null) => {
    set({ connectionMenuPosition: position });
  },

  setConnectionSourceInfo: (info: {
    sourceNodeId: string | null;
    sourceHandleId: string | null;
    targetNodeId?: string | null;
    targetHandleId?: string | null;
    handleType?: "source" | "target" | null;
  }) => {
    set({
      connectionSourceInfo: {
        sourceNodeId: info.sourceNodeId ?? null,
        sourceHandleId: info.sourceHandleId ?? null,
        targetNodeId: info.targetNodeId ?? null,
        targetHandleId: info.targetHandleId ?? null,
        handleType: info.handleType ?? null,
      },
    });
  },

  onNodesChange: (changes: NodeChange[]) => {
    const newNodes = applyNodeChanges(changes, get().nodes);
    set({ nodes: newNodes });

    // Trigger meaningful change logic only for meaningful changes
    if (isMeaningfulNodeChange(changes)) {
      // Auto-save functionality
      const { canvasId, projectName } = useCanvasMetadataStore.getState();
      triggerCanvasSave(canvasId || undefined, projectName);
      // You can add additional logic here like:
      // - Analytics tracking
      // - Undo/redo history
    }
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const currentEdges = get().edges;
    const clipboardStore = useClipboardStore.getState();

    // Track edge deletions for undo/redo (before applying changes, only if not during undo/redo)
    if (!clipboardStore.isUndoRedoInProgress) {
      const deletedEdgeIds: string[] = [];
      changes.forEach((change) => {
        if (change.type === "remove" && change.id) {
          deletedEdgeIds.push(change.id);
        }
      });
      if (deletedEdgeIds.length > 0) {
        clipboardStore.recordEdgeDelete(deletedEdgeIds);
      }
    }

    const newEdges = applyEdgeChanges(changes, currentEdges);
    set({ edges: newEdges });

    // Trigger meaningful change logic only for meaningful changes
    if (isMeaningfulEdgeChange(changes)) {
      // Auto-save functionality
      const { canvasId, projectName } = useCanvasMetadataStore.getState();
      triggerCanvasSave(canvasId || undefined, projectName);
      // You can add additional logic here like:
      // - Analytics tracking
      // - Undo/redo history
    }
  },

  onConnect: (connection: Connection) => {
    const { nodes, edges } = get();

    // Check if we need to replace existing connections due to max connections limit
    if (connection.target && connection.targetHandle) {
      const targetNode = nodes.find((n) => n.id === connection.target);
      const targetFlowConfig = targetNode?.data?.flowConfig as
        | NodeFlowConfig
        | undefined;

      if (targetFlowConfig?.inputs) {
        const targetHandle = targetFlowConfig.inputs.find(
          (h) => h.id === connection.targetHandle
        );

        const maxConnections = targetHandle?.maxConnections;

        if (maxConnections !== undefined && maxConnections > 0) {
          // Find existing edges connected to this target handle
          const existingEdges = edges.filter(
            (edge) =>
              edge.targetHandle === connection.targetHandle &&
              edge.target === connection.target
          );

          // If we're at or over the limit, validate the new connection first
          // by temporarily excluding the old connections from validation
          if (existingEdges.length >= maxConnections) {
            const edgesToRemove = existingEdges.map((edge) => edge.id);
            const edgesWithoutOld = edges.filter(
              (edge) => !edgesToRemove.includes(edge.id)
            );

            // Validate the new connection with old connections temporarily removed
            // This checks data types, node existence, etc., but allows the connection
            // since we're removing the old ones
            const isValid = isValidConnection(
              connection,
              nodes,
              edgesWithoutOld
            );

            if (!isValid) {
              // New connection is invalid - block it and keep old connections
              return; // Block the connection
            }

            // New connection is valid - remove old connections
            const remainingEdges = edges.filter(
              (edge) => !edgesToRemove.includes(edge.id)
            );

            // Record edge deletions for undo/redo (only if not during undo/redo or paste)
            const clipboardStore = useClipboardStore.getState();
            if (
              !clipboardStore.isUndoRedoInProgress &&
              !clipboardStore.isPasteInProgress
            ) {
              clipboardStore.recordEdgeDelete(edgesToRemove);
            }

            // Update edges state by removing the old connections
            set({ edges: remainingEdges });
          }
        }
      }
    }

    // Validate connection before creating edge (standard validation for non-max-connection cases)
    if (!isValidConnection(connection, get().nodes, get().edges)) {
      return; // Block the connection
    }

    const newEdge: Edge = {
      id: nanoid(),
      source: connection.source!,
      target: connection.target!,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: "custom-edge",
      updatable: true,
    } as any;

    set({
      edges: [...get().edges, newEdge],
    });

    // Record edge creation for undo/redo (only if not during undo/redo or paste)
    const clipboardStore = useClipboardStore.getState();
    if (
      !clipboardStore.isUndoRedoInProgress &&
      !clipboardStore.isPasteInProgress
    ) {
      clipboardStore.recordEdgeCreate([newEdge.id]);
    }

    // Trigger save after connection is created
    const { canvasId, projectName } = useCanvasMetadataStore.getState();
    triggerCanvasSave(canvasId || undefined, projectName);
  },

  onReconnect: (oldEdge: Edge, connection: Connection) => {
    // Set reconnecting edge ID at the start to prevent menu from opening
    set({ reconnectingEdgeId: oldEdge.id });

    // Validate connection
    const isValid = isValidConnection(connection, get().nodes, get().edges);

    if (!isValid) {
      // Clear reconnection state if validation fails
      set({ reconnectingEdgeId: null });
      return; // Block the reconnection
    }

    // Determine what changed: source or target
    // If source changed, connection.source will be new and connection.target might be undefined
    // If target changed, connection.target will be new and connection.source might be undefined
    const updatedEdge: Edge = {
      ...oldEdge,
      // Only update source if it's provided in the connection
      ...(connection.source && {
        source: connection.source,
        sourceHandle: connection.sourceHandle,
      }),
      // Only update target if it's provided in the connection
      ...(connection.target && {
        target: connection.target,
        targetHandle: connection.targetHandle,
      }),
    };

    // Replace old edge with updated edge
    // NOTE: Don't clear reconnectingEdgeId here - let onConnectEnd clear it
    // after checking, to avoid race condition where onConnectEnd fires after
    // this clears it but before it can read it
    set({
      edges: get().edges.map((edge) =>
        edge.id === oldEdge.id ? updatedEdge : edge
      ),
      // Keep reconnectingEdgeId set so onConnectEnd can detect it
    });

    // Record edge reconnection for undo/redo (only if not during undo/redo)
    const clipboardStore = useClipboardStore.getState();
    if (!clipboardStore.isUndoRedoInProgress) {
      clipboardStore.recordEdgeReconnect(oldEdge.id, oldEdge, updatedEdge);
    }

    // Trigger save after edge is reconnected
    const { canvasId, projectName } = useCanvasMetadataStore.getState();
    triggerCanvasSave(canvasId || undefined, projectName);
  },

  addNode: (
    type: string,
    position: { x: number; y: number },
    data?: any
  ): string => {
    const id = nanoid();
    console.log(`[canvas-store] addNode - type: ${type}, data:`, data);

    // Get the flow configuration for this node type
    let flowConfig = getNodeFlowConfig(type);

    // Special handling for single-upload-node: create dynamic flowConfig
    if (type === "single-upload-node" && !flowConfig) {
      // The handle dataType is dynamic based on uploaded asset or expectedDataType
      // We'll create a flowConfig with the asset-output handle that can output image/video/audio/string
      flowConfig = {
        inputs: [],
        outputs: [
          {
            id: "asset-output",
            type: "source",
            dataType: data?.expectedDataType || "string", // Will be updated dynamically
            position: "right",
          },
        ],
      };
    }

    // Get configOptions flag for this node type
    let configOptions = false;
    for (const section of getAllPreviewSections()) {
      const node = section.nodes.find((n) => n.nodeType === type);
      if (node) {
        configOptions = node.configOptions || false;
        break;
      }
    }

    // Set initial dimensions for resizable nodes
    let initialWidth: number | undefined;
    let initialHeight: number | undefined;

    if (type === "note-node") {
      initialWidth = 200;
      initialHeight = 150;
    }

    const newNode: Node = {
      id,
      type,
      position,
      ...(initialWidth &&
        initialHeight && {
          width: initialWidth,
          height: initialHeight,
        }),
      data: {
        ...data,
        flowConfig,
        configOptions,
      },
    };

    console.log(
      `[canvas-store] addNode - Created node ${id} with data:`,
      newNode.data
    );

    // Initialize config for image-generator-node
    if (type === "image-generator-node") {
      const defaultConfig = {
        imageCount: 1,
        orientation: "square" as const,
        style: {
          prompt: "",
          tool: "general" as const,
        },
      };
      useConfigStore.getState().initializeNodeConfig(id, defaultConfig);
    }

    // Initialize config for ai-image-editor-node
    if (type === "ai-image-editor-node") {
      const defaultConfig = {
        prompt: "",
        orientation: "square" as const,
      };
      useConfigStore.getState().initializeNodeConfig(id, defaultConfig);
    }

    // Initialize config for ai-image-upscaler-node
    if (type === "ai-image-upscaler-node") {
      const defaultConfig = {
        scaleFactor: "2",
        enhancement: "Balanced",
        prompt: "",
        orientation: "square" as const,
      };
      useConfigStore.getState().initializeNodeConfig(id, defaultConfig);
    }

    // Initialize config for face-swap-node
    if (type === "face-swap-node") {
      const defaultConfig = {
        faceSwapMode: "all-faces",
        orientation: "square" as const,
      };
      useConfigStore.getState().initializeNodeConfig(id, defaultConfig);
    }

    // Initialize config for face-swap-video-node
    if (type === "face-swap-video-node") {
      const defaultConfig = {
        name: undefined,
        startSeconds: 0,
        endSeconds: 15,
        orientation: "square" as const,
        style: {
          version: "default" as const,
        },
        assets: {
          faceSwapMode: "all-faces",
          videoSource: "file" as const,
          youtubeUrl: undefined,
        },
      };
      useConfigStore.getState().initializeNodeConfig(id, defaultConfig);
    }

    // Initialize config for lip-sync-node
    if (type === "lip-sync-node") {
      const defaultConfig = {
        name: undefined,
        startSeconds: 0,
        endSeconds: 15,
        maxFpsLimit: 12,
        orientation: "square" as const,
        style: {
          generationMode: "lite" as const,
        },
        assets: {
          videoSource: "file" as const,
          youtubeUrl: undefined,
        },
      };
      useConfigStore.getState().initializeNodeConfig(id, defaultConfig);
    }

    // Initialize config for video-generator-node
    if (type === "video-generator-node") {
      const defaultConfig = {
        mode: "text-to-video",
        endSeconds: 5,
        startSeconds: 0,
        resolution: "720p",
        orientation: "square",
        prompt: "",
        imageFilePath: undefined,
        fpsResolution: "HALF" as const,
        artStyle: "No Art Style",
        version: "default" as const,
        promptType: "default" as const,
        model: "default" as const,
      };
      useConfigStore.getState().initializeNodeConfig(id, defaultConfig);
    }

    // Initialize config for animation-node
    if (type === "animation-node") {
      const defaultConfig = {
        name: undefined,
        fps: 12,
        endSeconds: 15,
        width: 512,
        height: 960,
        orientation: "square" as const,
        style: {
          artStyle: "Painterly Illustration" as const,
          cameraEffect: "Simple Zoom In" as const,
          promptType: "custom" as const,
          prompt: "",
          transitionSpeed: 5,
        },
        assets: {
          audioSource: "file" as const,
          audioFilePath: undefined,
          youtubeUrl: undefined,
          imageFilePath: undefined,
        },
      };
      useConfigStore.getState().initializeNodeConfig(id, defaultConfig);
    }

    // Initialize config for ai-voice-generator-node
    if (type === "ai-voice-generator-node") {
      const defaultConfig = {
        prompt: "",
        voiceName: "Elon Musk",
      };
      useConfigStore.getState().initializeNodeConfig(id, defaultConfig);
    }

    // Initialize config for note-node
    if (type === "note-node") {
      const defaultConfig = {
        color: "#c084fc", // Purple default
      };
      useConfigStore.getState().initializeNodeConfig(id, defaultConfig);
    }

    set({
      nodes: [...get().nodes, newNode],
    });

    // Record node creation for undo/redo (only if not during undo/redo or paste)
    const clipboardStore = useClipboardStore.getState();
    if (
      !clipboardStore.isUndoRedoInProgress &&
      !clipboardStore.isPasteInProgress
    ) {
      clipboardStore.recordNodeCreate([id]);
    }

    // Trigger save after node is added
    const { canvasId, projectName } = useCanvasMetadataStore.getState();
    triggerCanvasSave(canvasId || undefined, projectName);

    return id;
  },

  addNodeAfter: (
    nodeType: string,
    afterNodeId: string,
    offsetX?: number,
    offsetY?: number
  ) => {
    const currentNodes = get().nodes;
    const nodeToAddAfter = currentNodes.find((node) => node.id === afterNodeId);

    if (!nodeToAddAfter) {
      console.warn(`Node with id ${afterNodeId} not found`);
      return null;
    }

    const newNodePosition = {
      x: nodeToAddAfter.position.x + (offsetX || 100),
      y: nodeToAddAfter.position.y + (offsetY || 100),
    };

    const newNodeId = get().addNode(nodeType, newNodePosition);

    if (!newNodeId) {
      return null;
    }

    // Special handling for single-upload-node as source
    if (nodeToAddAfter.type === "single-upload-node") {
      const targetNode = get().nodes.find((n) => n.id === newNodeId);
      const targetFlowConfig = targetNode?.data?.flowConfig as
        | NodeFlowConfig
        | undefined;

      if (targetFlowConfig?.inputs) {
        // Get the source dataType from single-upload-node
        const assetType = nodeToAddAfter.data?.assetType as
          | "image"
          | "video"
          | "audio"
          | null
          | undefined;
        const expectedDataType = nodeToAddAfter.data?.expectedDataType as
          | "image"
          | "video"
          | "audio"
          | "string"
          | null
          | undefined;

        const sourceDataType =
          assetType ||
          (expectedDataType && expectedDataType !== "string"
            ? expectedDataType
            : "string");

        // Find first compatible input handle
        for (const input of targetFlowConfig.inputs) {
          if (input.dataType === sourceDataType) {
            const testConnection = {
              source: afterNodeId,
              target: newNodeId,
              sourceHandle: "asset-output",
              targetHandle: input.id,
            };

            // Validate the connection before creating the edge
            if (isValidConnection(testConnection, get().nodes, get().edges)) {
              const newEdge: Edge = {
                id: nanoid(),
                source: afterNodeId,
                target: newNodeId,
                sourceHandle: "asset-output",
                targetHandle: input.id,
                type: "custom-edge",
                updatable: true,
              } as any;

              set({
                edges: [...get().edges, newEdge],
              });

              return newNodeId;
            }
          }
        }
      }
      return newNodeId;
    }

    // Auto-connect: find first compatible output/input pair
    const sourceFlowConfig = nodeToAddAfter.data?.flowConfig as
      | NodeFlowConfig
      | undefined;
    const targetNode = get().nodes.find((n) => n.id === newNodeId);
    const targetFlowConfig = targetNode?.data?.flowConfig as
      | NodeFlowConfig
      | undefined;

    // Find first valid connection between output and input handles
    if (sourceFlowConfig?.outputs && targetFlowConfig?.inputs) {
      for (const output of sourceFlowConfig.outputs) {
        for (const input of targetFlowConfig.inputs) {
          const testConnection = {
            source: afterNodeId,
            target: newNodeId,
            sourceHandle: output.id,
            targetHandle: input.id,
          };

          // Validate the connection before creating the edge
          if (isValidConnection(testConnection, get().nodes, get().edges)) {
            const newEdge: Edge = {
              id: nanoid(),
              source: afterNodeId,
              target: newNodeId,
              sourceHandle: output.id,
              targetHandle: input.id,
              type: "custom-edge",
              updatable: true,
            } as any;

            set({
              edges: [...get().edges, newEdge],
            });

            return newNodeId;
          }
        }
      }
    }

    return newNodeId;
  },

  addNodeBefore: (
    nodeType: string,
    beforeNodeId: string,
    offsetX?: number,
    offsetY?: number,
    targetInputHandleId?: string,
    targetInputDataType?: string,
    initialData?: any
  ) => {
    console.log(
      `[canvas-store] addNodeBefore - nodeType: ${nodeType}, initialData:`,
      initialData
    );
    const currentNodes = get().nodes;
    const currentEdges = get().edges;
    const nodeToAddBefore = currentNodes.find(
      (node) => node.id === beforeNodeId
    );

    if (!nodeToAddBefore) {
      console.warn(`Node with id ${beforeNodeId} not found`);
      return null;
    }

    const newNodePosition = {
      x: nodeToAddBefore.position.x + (offsetX || -800),
      y: nodeToAddBefore.position.y + (offsetY || 0),
    };

    const newNodeId = get().addNode(nodeType, newNodePosition, initialData);
    console.log(
      `[canvas-store] addNodeBefore - Created node ${newNodeId}, checking data:`,
      get().nodes.find((n) => n.id === newNodeId)?.data
    );

    if (!newNodeId) {
      return null;
    }

    const targetFlowConfig = nodeToAddBefore.data?.flowConfig as
      | NodeFlowConfig
      | undefined;
    const sourceNode = get().nodes.find((n) => n.id === newNodeId);
    const sourceFlowConfig = sourceNode?.data?.flowConfig as
      | NodeFlowConfig
      | undefined;

    if (!targetFlowConfig?.inputs) {
      return newNodeId;
    }

    // Helper function to find unconnected asset inputs in priority order
    const findUnconnectedAssetInput = (
      assetDataTypes: string[],
      priorityOrder: string[]
    ) => {
      const unconnectedRequiredInputs = targetFlowConfig.inputs.filter(
        (input) => {
          if (!input.required) return false;
          return !currentEdges.some(
            (edge) =>
              edge.target === beforeNodeId && edge.targetHandle === input.id
          );
        }
      );

      // Filter to asset types only and sort by priority
      const unconnectedAssetInputs = unconnectedRequiredInputs
        .filter((input) => assetDataTypes.includes(input.dataType))
        .sort((a, b) => {
          return (
            priorityOrder.indexOf(a.dataType) -
            priorityOrder.indexOf(b.dataType)
          );
        });

      return unconnectedAssetInputs.length > 0
        ? unconnectedAssetInputs[0]
        : null;
    };

    // For single-upload-node: find first unconnected asset input (image > video > audio)
    if (nodeType === "single-upload-node") {
      const assetDataTypes = ["image", "video", "audio"];
      const priorityOrder = ["image", "video", "audio"];

      // Use provided target input if available and valid
      let targetInput: { id: string; dataType: string } | null = null;

      if (
        targetInputHandleId &&
        targetInputDataType &&
        assetDataTypes.includes(targetInputDataType)
      ) {
        const input = targetFlowConfig.inputs.find(
          (inp) =>
            inp.id === targetInputHandleId &&
            inp.dataType === targetInputDataType &&
            inp.required
        );
        if (input) {
          const isConnected = currentEdges.some(
            (edge) =>
              edge.target === beforeNodeId && edge.targetHandle === input.id
          );
          if (!isConnected) {
            targetInput = { id: input.id, dataType: input.dataType };
          }
        }
      }

      // If no explicit target or invalid, find first unconnected asset input
      if (!targetInput) {
        const foundInput = findUnconnectedAssetInput(
          assetDataTypes,
          priorityOrder
        );
        if (foundInput) {
          targetInput = {
            id: foundInput.id,
            dataType: foundInput.dataType,
          };
        }
      }

      // Connect to the target input if found
      if (targetInput && assetDataTypes.includes(targetInput.dataType)) {
        // Update node data with expectedDataType and flowConfig
        const currentNode = get().nodes.find((n) => n.id === newNodeId);
        if (currentNode) {
          const currentFlowConfig = currentNode.data?.flowConfig as
            | NodeFlowConfig
            | undefined;

          get().updateNodeData(newNodeId, {
            expectedDataType: targetInput.dataType,
            flowConfig: currentFlowConfig
              ? {
                  ...currentFlowConfig,
                  outputs: [
                    {
                      id: "asset-output",
                      type: "source",
                      dataType: targetInput.dataType,
                      position: "right",
                    },
                  ],
                }
              : {
                  inputs: [],
                  outputs: [
                    {
                      id: "asset-output",
                      type: "source",
                      dataType: targetInput.dataType,
                      position: "right",
                    },
                  ],
                },
          });
        }

        const testConnection = {
          source: newNodeId,
          target: beforeNodeId,
          sourceHandle: "asset-output",
          targetHandle: targetInput.id,
        };

        const updatedNodes = get().nodes;
        const updatedEdges = get().edges;

        if (isValidConnection(testConnection, updatedNodes, updatedEdges)) {
          const newEdge: Edge = {
            id: nanoid(),
            source: newNodeId,
            target: beforeNodeId,
            sourceHandle: "asset-output",
            targetHandle: targetInput.id,
            type: "custom-edge",
            updatable: true,
          } as any;

          set({
            edges: [...updatedEdges, newEdge],
          });

          return newNodeId;
        }
      }

      return newNodeId;
    }

    // For other node types: find first compatible output/input pair
    if (sourceFlowConfig?.outputs) {
      const unconnectedRequiredInputs = targetFlowConfig.inputs.filter(
        (input) => {
          if (!input.required) return false;
          return !currentEdges.some(
            (edge) =>
              edge.target === beforeNodeId && edge.targetHandle === input.id
          );
        }
      );

      // Use provided target input if available, otherwise find matching input
      let targetInput: { id: string; dataType: string } | null = null;

      if (
        targetInputHandleId &&
        targetInputDataType &&
        sourceFlowConfig.outputs.some(
          (output) => output.dataType === targetInputDataType
        )
      ) {
        const input = targetFlowConfig.inputs.find(
          (inp) =>
            inp.id === targetInputHandleId &&
            inp.dataType === targetInputDataType &&
            inp.required
        );
        if (input) {
          const isConnected = currentEdges.some(
            (edge) =>
              edge.target === beforeNodeId && edge.targetHandle === input.id
          );
          if (!isConnected) {
            targetInput = { id: input.id, dataType: input.dataType };
          }
        }
      }

      // If no explicit target, find first compatible connection
      if (!targetInput) {
        for (const output of sourceFlowConfig.outputs) {
          const matchingInput = unconnectedRequiredInputs.find(
            (input) => input.dataType === output.dataType
          );

          if (matchingInput) {
            targetInput = {
              id: matchingInput.id,
              dataType: matchingInput.dataType,
            };
            break;
          }
        }
      }

      // Create connection if target input found
      if (targetInput) {
        const matchingOutput = sourceFlowConfig.outputs.find(
          (output) => output.dataType === targetInput!.dataType
        );

        if (matchingOutput && targetInput) {
          const testConnection = {
            source: newNodeId,
            target: beforeNodeId,
            sourceHandle: matchingOutput.id,
            targetHandle: targetInput.id,
          };

          if (isValidConnection(testConnection, get().nodes, get().edges)) {
            const newEdge: Edge = {
              id: nanoid(),
              source: newNodeId,
              target: beforeNodeId,
              sourceHandle: matchingOutput.id,
              targetHandle: targetInput.id,
              type: "custom-edge",
              updatable: true,
            } as any;

            set({
              edges: [...get().edges, newEdge],
            });

            return newNodeId;
          }
        }
      }
    }

    return newNodeId;
  },

  addNodeAtPositionAndConnect: (
    nodeType: string,
    position: { x: number; y: number },
    sourceNodeId: string,
    sourceHandleId?: string | null
  ) => {
    // Find the source node
    const currentNodes = get().nodes;
    const sourceNode = currentNodes.find((node) => node.id === sourceNodeId);

    if (!sourceNode) {
      console.warn(`Source node with id ${sourceNodeId} not found`);
      return null;
    }

    // Add the new node at the specified position
    const newNodeId = get().addNode(nodeType, position);

    if (!newNodeId) {
      return null;
    }

    // Get the newly created node
    const targetNode = get().nodes.find((n) => n.id === newNodeId);
    if (!targetNode) {
      return null;
    }

    // Get flow configs for both nodes
    const sourceFlowConfig = sourceNode.data?.flowConfig as
      | NodeFlowConfig
      | undefined;
    const targetFlowConfig = targetNode.data?.flowConfig as
      | NodeFlowConfig
      | undefined;

    // Special handling for upload-node: use uploadedAssets to get asset handle info
    if (sourceNode.type === "upload-node" && sourceHandleId) {
      const uploadedAssets = sourceNode.data?.uploadedAssets as
        | Array<{
            id: string;
            type: "image" | "video" | "audio";
          }>
        | undefined;

      if (uploadedAssets) {
        const asset = uploadedAssets.find((a) => a.id === sourceHandleId);
        if (asset && targetFlowConfig?.inputs) {
          // Find compatible input handle for this asset type
          for (const input of targetFlowConfig.inputs) {
            if (input.dataType === asset.type) {
              const testConnection = {
                source: sourceNodeId,
                target: newNodeId,
                sourceHandle: sourceHandleId,
                targetHandle: input.id,
              };

              // Validate the connection before creating the edge
              if (isValidConnection(testConnection, get().nodes, get().edges)) {
                const newEdge: Edge = {
                  id: nanoid(),
                  source: sourceNodeId,
                  target: newNodeId,
                  sourceHandle: sourceHandleId,
                  targetHandle: input.id,
                  type: "custom-edge",
                  updatable: true,
                } as any;

                set({
                  edges: [...get().edges, newEdge],
                });

                return newNodeId;
              }
            }
          }
        }
      }
    }

    // For other nodes or if no specific handle ID provided, use flowConfig outputs
    if (sourceFlowConfig?.outputs && targetFlowConfig?.inputs) {
      // If sourceHandleId is provided, try to use it first
      if (sourceHandleId) {
        const matchingOutput = sourceFlowConfig.outputs.find(
          (output) => output.id === sourceHandleId
        );
        if (matchingOutput) {
          for (const input of targetFlowConfig.inputs) {
            if (input.dataType === matchingOutput.dataType) {
              const testConnection = {
                source: sourceNodeId,
                target: newNodeId,
                sourceHandle: sourceHandleId,
                targetHandle: input.id,
              };

              if (isValidConnection(testConnection, get().nodes, get().edges)) {
                const newEdge: Edge = {
                  id: nanoid(),
                  source: sourceNodeId,
                  target: newNodeId,
                  sourceHandle: sourceHandleId,
                  targetHandle: input.id,
                  type: "custom-edge",
                  updatable: true,
                } as any;

                set({
                  edges: [...get().edges, newEdge],
                });

                return newNodeId;
              }
            }
          }
        }
      }

      // Fallback: find first valid connection between output and input handles
      for (const output of sourceFlowConfig.outputs) {
        for (const input of targetFlowConfig.inputs) {
          const testConnection = {
            source: sourceNodeId,
            target: newNodeId,
            sourceHandle: output.id,
            targetHandle: input.id,
          };

          // Validate the connection before creating the edge
          if (isValidConnection(testConnection, get().nodes, get().edges)) {
            const newEdge: Edge = {
              id: nanoid(),
              source: sourceNodeId,
              target: newNodeId,
              sourceHandle: output.id,
              targetHandle: input.id,
              type: "custom-edge",
              updatable: true,
            } as any;

            set({
              edges: [...get().edges, newEdge],
            });

            return newNodeId;
          }
        }
      }
    }

    // Node was added but no connection was made (no compatible handles)
    return newNodeId;
  },

  addNodeAtPositionAndConnectToTarget: (
    nodeType: string,
    position: { x: number; y: number },
    targetNodeId: string,
    targetHandleId: string | null
  ) => {
    // Find the target node
    const currentNodes = get().nodes;
    const targetNode = currentNodes.find((node) => node.id === targetNodeId);

    if (!targetNode) {
      console.warn(`Target node with id ${targetNodeId} not found`);
      return null;
    }

    // Add the new node at the specified position
    const newNodeId = get().addNode(nodeType, position);

    if (!newNodeId) {
      return null;
    }

    // Get the newly created node
    const sourceNode = get().nodes.find((n) => n.id === newNodeId);
    if (!sourceNode) {
      return null;
    }

    // Get flow configs for both nodes
    let sourceFlowConfig = sourceNode.data?.flowConfig as
      | NodeFlowConfig
      | undefined;
    const targetFlowConfig = targetNode.data?.flowConfig as
      | NodeFlowConfig
      | undefined;

    if (!targetFlowConfig?.inputs) {
      return newNodeId;
    }

    // Find the target input handle if specified
    let targetInput = targetHandleId
      ? targetFlowConfig.inputs.find((input) => input.id === targetHandleId)
      : null;

    // Special handling for single-upload-node: set expectedDataType based on target input
    if (nodeType === "single-upload-node" && targetInput) {
      const assetDataTypes = ["image", "video", "audio"];

      // Validate the target input's dataType is an asset type
      if (assetDataTypes.includes(targetInput.dataType)) {
        const currentFlowConfig = sourceNode.data?.flowConfig as
          | NodeFlowConfig
          | undefined;

        // Update node data with expectedDataType and flowConfig
        get().updateNodeData(newNodeId, {
          expectedDataType: targetInput.dataType,
          flowConfig: currentFlowConfig
            ? {
                ...currentFlowConfig,
                outputs: [
                  {
                    id: "asset-output",
                    type: "source",
                    dataType: targetInput.dataType,
                    position: "right",
                  },
                ],
              }
            : {
                inputs: [],
                outputs: [
                  {
                    id: "asset-output",
                    type: "source",
                    dataType: targetInput.dataType,
                    position: "right",
                  },
                ],
              },
        });

        // Update sourceFlowConfig reference after updateNodeData
        const updatedNode = get().nodes.find((n) => n.id === newNodeId);
        if (updatedNode) {
          sourceFlowConfig = updatedNode.data?.flowConfig as
            | NodeFlowConfig
            | undefined;
        }
      }
    }

    // If no specific handle or handle not found, find first compatible input
    if (!targetInput) {
      // Find first compatible input handle
      if (sourceFlowConfig?.outputs) {
        for (const output of sourceFlowConfig.outputs) {
          const matchingInput = targetFlowConfig.inputs.find(
            (input) => input.dataType === output.dataType
          );
          if (matchingInput) {
            targetInput = matchingInput;
            break;
          }
        }
      }
    }

    // Connect if we found a compatible input
    if (targetInput && sourceFlowConfig?.outputs) {
      const matchingOutput = sourceFlowConfig.outputs.find(
        (output) => output.dataType === targetInput!.dataType
      );

      if (matchingOutput) {
        const testConnection = {
          source: newNodeId,
          target: targetNodeId,
          sourceHandle: matchingOutput.id,
          targetHandle: targetInput.id,
        };

        // Validate the connection before creating the edge
        if (isValidConnection(testConnection, get().nodes, get().edges)) {
          const newEdge: Edge = {
            id: nanoid(),
            source: newNodeId,
            target: targetNodeId,
            sourceHandle: matchingOutput.id,
            targetHandle: targetInput.id,
            type: "custom-edge",
            updatable: true,
          } as any;

          set({
            edges: [...get().edges, newEdge],
          });

          return newNodeId;
        }
      }
    }

    // Node was added but no connection was made (no compatible handles)
    return newNodeId;
  },

  deleteNode: (nodeId: string) => {
    const { nodes, edges } = get();
    const clipboardStore = useClipboardStore.getState();

    // Record node deletion for undo/redo (before deletion, only if not during undo/redo)
    if (!clipboardStore.isUndoRedoInProgress) {
      clipboardStore.recordNodeDelete([nodeId]);

      // Record edge deletions for edges connected to this node
      const connectedEdgeIds = edges
        .filter((edge) => edge.source === nodeId || edge.target === nodeId)
        .map((edge) => edge.id);
      if (connectedEdgeIds.length > 0) {
        clipboardStore.recordEdgeDelete(connectedEdgeIds);
      }
    }

    // Remove the node from nodes array
    const filteredNodes = nodes.filter((node) => node.id !== nodeId);

    // Remove all edges connected to this node
    const filteredEdges = edges.filter(
      (edge) => edge.source !== nodeId && edge.target !== nodeId
    );

    set({
      nodes: filteredNodes,
      edges: filteredEdges,
    });

    // Trigger save after node is deleted
    const { canvasId, projectName } = useCanvasMetadataStore.getState();
    triggerCanvasSave(canvasId || undefined, projectName);
  },

  updateNodeData: (nodeId: string, data: Partial<any>) => {
    console.log(
      `[canvas-store] updateNodeData - nodeId: ${nodeId}, data:`,
      data
    );
    const currentNodes = get().nodes;
    const nodeToUpdate = currentNodes.find((node) => node.id === nodeId);

    if (!nodeToUpdate) {
      console.warn(`Node with id ${nodeId} not found`);
      return;
    }

    console.log(
      `[canvas-store] updateNodeData - Current node data:`,
      nodeToUpdate.data
    );

    // Check if the data actually changed to avoid unnecessary updates
    const hasDataChanged = Object.keys(data).some(
      (key) => nodeToUpdate.data[key] !== data[key]
    );

    if (!hasDataChanged) {
      console.log(
        `[canvas-store] updateNodeData - No changes detected, skipping update`
      );
      return; // No changes, skip update
    }

    const updatedNodes = currentNodes.map((node) =>
      node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
    );

    console.log(
      `[canvas-store] updateNodeData - Updated node data:`,
      updatedNodes.find((n) => n.id === nodeId)?.data
    );

    set({
      nodes: updatedNodes,
    });

    // Trigger save when meaningful asset data changes
    // These fields indicate generated assets or important state changes
    const meaningfulFields = [
      "imageDetails",
      "generatedImageId",
      "creditsCharged",
      "videoDetails",
      "audioDetails",
      "filePath",
      "previewUrl",
      "uploadedFileName",
      "fileName",
    ];

    const hasMeaningfulChange = Object.keys(data).some((key) =>
      meaningfulFields.includes(key)
    );

    if (hasMeaningfulChange) {
      const { canvasId, projectName } = useCanvasMetadataStore.getState();
      triggerCanvasSave(canvasId || undefined, projectName);
    }
  },

  updateNodeDimensions: (nodeId: string, width?: number, height?: number) => {
    const currentNodes = get().nodes;
    const nodeToUpdate = currentNodes.find((node) => node.id === nodeId);

    if (!nodeToUpdate) {
      console.warn(`Node with id ${nodeId} not found`);
      return;
    }

    set({
      nodes: currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              ...(width !== undefined && { width }),
              ...(height !== undefined && { height }),
            }
          : node
      ),
    });
  },

  resetFlow: () => {
    set({
      nodes: [],
      edges: [],
    });
  },

  selectNode: (nodeId: string) => {
    const currentNodes = get().nodes;
    const updatedNodes = currentNodes.map((node) => ({
      ...node,
      selected: node.id === nodeId,
    }));
    set({ nodes: updatedNodes });
  },
}));

export default useFlowStore;
