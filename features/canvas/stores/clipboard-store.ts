import { create } from "zustand";
import { Connection, Edge, Node } from "@xyflow/react";
import useFlowStore from "./canvas-store";
import useConfigStore from "./config-store";
import useCanvasMetadataStore from "./canvas-metadata-store";
import { isValidConnection } from "../lib/canvas";
import { triggerCanvasSave } from "../lib/canvas";

export type CopiedNode = {
  type: string;
  position: { x: number; y: number };
  data: any;
  config?: any;
  originalId: string;
  width?: number;
  height?: number;
};

export type CopiedEdge = {
  source: string;
  target: string;
  sourceHandle: string | null;
  targetHandle: string | null;
};

export type NodeSnapshot = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
  config?: any;
  width?: number;
  height?: number;
  selected?: boolean;
};

export type EdgeSnapshot = {
  id: string;
  source: string;
  target: string;
  sourceHandle: string | null;
  targetHandle: string | null;
  type?: string;
};

export type UndoRedoAction =
  | {
      type: "node_create";
      nodeIds: string[];
      nodeSnapshots: NodeSnapshot[];
    }
  | {
      type: "node_delete";
      nodeIds: string[];
      nodeSnapshots: NodeSnapshot[];
    }
  | {
      type: "edge_create";
      edgeIds: string[];
      edgeSnapshots: EdgeSnapshot[];
    }
  | {
      type: "edge_delete";
      edgeIds: string[];
      edgeSnapshots: EdgeSnapshot[];
    }
  | {
      type: "edge_reconnect";
      edgeId: string;
      oldEdge: EdgeSnapshot;
      newEdge: EdgeSnapshot;
    }
  | {
      type: "paste";
      nodeIds: string[];
      nodeSnapshots: NodeSnapshot[];
      edgeIds: string[];
      edgeSnapshots: EdgeSnapshot[];
    };

export interface ClipboardState {
  copiedNodes: CopiedNode[] | null;
  copiedEdges: CopiedEdge[] | null;
  copySelectedNodes: () => void;
  pasteNodes: (position: { x: number; y: number }) => void;
  setCopiedNodes: (nodes: CopiedNode[] | null) => void;
  setCopiedEdges: (edges: CopiedEdge[] | null) => void;
  // Undo/Redo state
  undoStack: UndoRedoAction[];
  redoStack: UndoRedoAction[];
  isUndoRedoInProgress: boolean;
  isPasteInProgress: boolean;
  // Undo/Redo methods
  undo: () => void;
  redo: () => void;
  recordAction: (action: UndoRedoAction) => void;
  // Recording helpers
  recordNodeCreate: (nodeIds: string[]) => void;
  recordNodeDelete: (nodeIds: string[]) => void;
  recordEdgeCreate: (edgeIds: string[]) => void;
  recordEdgeDelete: (edgeIds: string[]) => void;
  recordEdgeReconnect: (edgeId: string, oldEdge: Edge, newEdge: Edge) => void;
  recordPaste: (nodeIds: string[], edgeIds: string[]) => void;
  // Snapshot helpers (internal, not exposed in interface but needed for implementation)
  createNodeSnapshot: (nodeId: string) => NodeSnapshot | null;
  createEdgeSnapshot: (edgeId: string) => EdgeSnapshot | null;
  createNodeSnapshots: (nodeIds: string[]) => NodeSnapshot[];
  createEdgeSnapshots: (edgeIds: string[]) => EdgeSnapshot[];
}

const MAX_HISTORY_SIZE = 50;

const useClipboardStore = create<ClipboardState>((set, get) => ({
  copiedNodes: null,
  copiedEdges: null,
  undoStack: [],
  redoStack: [],
  isUndoRedoInProgress: false,
  isPasteInProgress: false,

  setCopiedNodes: (nodes) => {
    set({ copiedNodes: nodes });
  },

  setCopiedEdges: (edges) => {
    set({ copiedEdges: edges });
  },

  // Snapshot creation helpers
  createNodeSnapshot: (nodeId: string): NodeSnapshot | null => {
    const flowStore = useFlowStore.getState();
    const node = flowStore.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const nodeConfigs = useConfigStore.getState().nodeConfigs;
    const nodeData = { ...node.data };
    delete nodeData.id; // Remove ID from data

    return {
      id: node.id,
      type: node.type!,
      position: { ...node.position },
      data: nodeData,
      config: nodeConfigs[node.id] ? { ...nodeConfigs[node.id] } : undefined,
      width: node.width,
      height: node.height,
      selected: node.selected,
    };
  },

  createEdgeSnapshot: (edgeId: string): EdgeSnapshot | null => {
    const flowStore = useFlowStore.getState();
    const edge = flowStore.edges.find((e) => e.id === edgeId);
    if (!edge) return null;

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      type: edge.type,
    };
  },

  createNodeSnapshots: (nodeIds: string[]): NodeSnapshot[] => {
    return nodeIds
      .map((id) => get().createNodeSnapshot(id))
      .filter((snapshot): snapshot is NodeSnapshot => snapshot !== null);
  },

  createEdgeSnapshots: (edgeIds: string[]): EdgeSnapshot[] => {
    return edgeIds
      .map((id) => get().createEdgeSnapshot(id))
      .filter((snapshot): snapshot is EdgeSnapshot => snapshot !== null);
  },

  // Record action to undo stack
  recordAction: (action: UndoRedoAction) => {
    const { isUndoRedoInProgress, undoStack } = get();

    // Don't record if undo/redo is in progress
    if (isUndoRedoInProgress) {
      return;
    }

    // Add to undo stack and enforce limit
    const newUndoStack = [...undoStack, action];
    if (newUndoStack.length > MAX_HISTORY_SIZE) {
      newUndoStack.shift(); // Remove oldest action
    }

    set({
      undoStack: newUndoStack,
      redoStack: [], // Clear redo stack when new action is recorded
    });
  },

  // Recording wrapper functions
  recordNodeCreate: (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    const nodeSnapshots = get().createNodeSnapshots(nodeIds);
    get().recordAction({
      type: "node_create",
      nodeIds,
      nodeSnapshots,
    });
  },

  recordNodeDelete: (nodeIds: string[]) => {
    if (nodeIds.length === 0) return;
    const nodeSnapshots = get().createNodeSnapshots(nodeIds);
    get().recordAction({
      type: "node_delete",
      nodeIds,
      nodeSnapshots,
    });
  },

  recordEdgeCreate: (edgeIds: string[]) => {
    if (edgeIds.length === 0) return;
    const edgeSnapshots = get().createEdgeSnapshots(edgeIds);
    get().recordAction({
      type: "edge_create",
      edgeIds,
      edgeSnapshots,
    });
  },

  recordEdgeDelete: (edgeIds: string[]) => {
    if (edgeIds.length === 0) return;
    const edgeSnapshots = get().createEdgeSnapshots(edgeIds);
    get().recordAction({
      type: "edge_delete",
      edgeIds,
      edgeSnapshots,
    });
  },

  recordEdgeReconnect: (edgeId: string, oldEdge: Edge, newEdge: Edge) => {
    const oldEdgeSnapshot: EdgeSnapshot = {
      id: oldEdge.id,
      source: oldEdge.source,
      target: oldEdge.target,
      sourceHandle: oldEdge.sourceHandle || null,
      targetHandle: oldEdge.targetHandle || null,
      type: oldEdge.type,
    };

    const newEdgeSnapshot: EdgeSnapshot = {
      id: newEdge.id,
      source: newEdge.source,
      target: newEdge.target,
      sourceHandle: newEdge.sourceHandle || null,
      targetHandle: newEdge.targetHandle || null,
      type: newEdge.type,
    };

    get().recordAction({
      type: "edge_reconnect",
      edgeId,
      oldEdge: oldEdgeSnapshot,
      newEdge: newEdgeSnapshot,
    });
  },

  recordPaste: (nodeIds: string[], edgeIds: string[]) => {
    if (nodeIds.length === 0) return;
    const nodeSnapshots = get().createNodeSnapshots(nodeIds);
    const edgeSnapshots =
      edgeIds.length > 0 ? get().createEdgeSnapshots(edgeIds) : [];
    get().recordAction({
      type: "paste",
      nodeIds,
      nodeSnapshots,
      edgeIds,
      edgeSnapshots,
    });
  },

  copySelectedNodes: () => {
    const flowStore = useFlowStore.getState();
    const { nodes, edges } = flowStore;
    const selectedNodes = nodes.filter((node) => node.selected === true);

    if (selectedNodes.length === 0) {
      return;
    }

    const nodeConfigs = useConfigStore.getState().nodeConfigs;
    const copiedNodesData: CopiedNode[] = selectedNodes.map((node) => {
      const nodeData = { ...node.data };

      // Remove ID from data
      delete nodeData.id;

      // Check if node is generating (has generated*Id but no *Details)
      const isGenerating =
        (nodeData.generatedImageId && !nodeData.imageDetails) ||
        (nodeData.generatedVideoId && !nodeData.videoDetails) ||
        (nodeData.generatedAudioId && !nodeData.audioDetails);

      // If generating, exclude asset details
      if (isGenerating) {
        delete nodeData.imageDetails;
        delete nodeData.videoDetails;
        delete nodeData.audioDetails;
        delete nodeData.filePath;
        delete nodeData.previewUrl;
      }

      return {
        type: node.type!,
        position: { ...node.position },
        data: nodeData,
        config: nodeConfigs[node.id] ? { ...nodeConfigs[node.id] } : undefined,
        originalId: node.id,
        width: node.width,
        height: node.height,
      };
    });

    // Copy edges between selected nodes (only if multiple nodes selected)
    let copiedEdgesData: CopiedEdge[] | null = null;

    if (selectedNodes.length > 1) {
      const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
      copiedEdgesData = edges
        .filter(
          (edge) =>
            selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
        )
        .map((edge) => ({
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle || null,
          targetHandle: edge.targetHandle || null,
        }));
    }

    set({
      copiedNodes: copiedNodesData,
      copiedEdges: copiedEdgesData,
    });
  },

  pasteNodes: (position: { x: number; y: number }) => {
    const { copiedNodes, copiedEdges } = get();

    if (!copiedNodes || copiedNodes.length === 0) {
      return;
    }

    const flowStore = useFlowStore.getState();

    // Set paste flag to prevent individual node_create recordings
    set({ isPasteInProgress: true });

    // Calculate offset from first node position to cursor position
    const firstNodePosition = copiedNodes[0].position;
    const offsetX = position.x - firstNodePosition.x;
    const offsetY = position.y - firstNodePosition.y;

    // Create mapping of old node IDs to new node IDs
    const nodeIdMapping = new Map<string, string>();

    // Create all nodes first
    copiedNodes.forEach((copiedNode) => {
      const newPosition = {
        x: copiedNode.position.x + offsetX,
        y: copiedNode.position.y + offsetY,
      };

      const newNodeId = flowStore.addNode(
        copiedNode.type,
        newPosition,
        copiedNode.data
      );

      nodeIdMapping.set(copiedNode.originalId, newNodeId);

      // Restore width/height if they exist (e.g., for note-node)
      // Note: width/height are node properties, not data properties
      if (copiedNode.width !== undefined || copiedNode.height !== undefined) {
        flowStore.updateNodeDimensions(
          newNodeId,
          copiedNode.width,
          copiedNode.height
        );
      }

      // Restore config if it exists
      if (copiedNode.config) {
        useConfigStore
          .getState()
          .initializeNodeConfig(newNodeId, copiedNode.config);
      }
    });

    // Create edges between pasted nodes
    const createdEdgeIds: string[] = [];
    if (copiedEdges && copiedEdges.length > 0) {
      copiedEdges.forEach((edge) => {
        const newSourceId = nodeIdMapping.get(edge.source);
        const newTargetId = nodeIdMapping.get(edge.target);

        if (newSourceId && newTargetId) {
          const connection: Connection = {
            source: newSourceId,
            target: newTargetId,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
          };

          // Validate and create edge
          const currentNodes = useFlowStore.getState().nodes;
          const currentEdges = useFlowStore.getState().edges;
          if (isValidConnection(connection, currentNodes, currentEdges)) {
            flowStore.onConnect(connection);
            // Get the newly created edge ID
            const updatedEdges = useFlowStore.getState().edges;
            const newEdge = updatedEdges.find(
              (e) =>
                e.source === newSourceId &&
                e.target === newTargetId &&
                e.sourceHandle === edge.sourceHandle &&
                e.targetHandle === edge.targetHandle
            );
            if (newEdge) {
              createdEdgeIds.push(newEdge.id);
            }
          }
        }
      });
    }

    // Record paste action (only if not during undo/redo)
    if (!get().isUndoRedoInProgress) {
      const createdNodeIds = Array.from(nodeIdMapping.values());
      get().recordPaste(createdNodeIds, createdEdgeIds);
    }

    // Clear paste flag
    set({ isPasteInProgress: false });

    // Don't clear clipboard - keep copied nodes for multiple pastes
    // Clipboard will only be cleared when new nodes are copied

    // Trigger save
    const { canvasId, projectName } = useCanvasMetadataStore.getState();
    triggerCanvasSave(canvasId || undefined, projectName);
  },

  // Undo/Redo implementation
  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) {
      return;
    }

    const action = undoStack[undoStack.length - 1];
    const flowStore = useFlowStore.getState();

    set({ isUndoRedoInProgress: true });

    try {
      switch (action.type) {
        case "node_create": {
          // Capture the latest state (text/config) before deleting.
          // This ensures Redo restores the node with the text that was typed.
          const latestSnapshots = get().createNodeSnapshots(action.nodeIds);
          if (latestSnapshots.length > 0) {
            action.nodeSnapshots = latestSnapshots;
          }

          // Delete created nodes
          action.nodeIds.forEach((nodeId) => {
            flowStore.deleteNode(nodeId);
          });
          break;
        }

        case "node_delete": {
          // Restore deleted nodes
          const restoredNodeIds: string[] = [];
          action.nodeSnapshots.forEach((snapshot) => {
            const nodeId = flowStore.addNode(
              snapshot.type,
              snapshot.position,
              snapshot.data,
              snapshot.id
            );
            restoredNodeIds.push(nodeId);

            // Restore width/height
            if (snapshot.width !== undefined || snapshot.height !== undefined) {
              flowStore.updateNodeDimensions(
                nodeId,
                snapshot.width,
                snapshot.height
              );
            }

            // Restore config
            if (snapshot.config) {
              useConfigStore
                .getState()
                .initializeNodeConfig(nodeId, snapshot.config);
            }
          });

          // Select restored nodes
          if (restoredNodeIds.length > 0) {
            const currentNodes = useFlowStore.getState().nodes;
            const updatedNodes = currentNodes.map((node) =>
              restoredNodeIds.includes(node.id)
                ? { ...node, selected: true }
                : { ...node, selected: false }
            );
            useFlowStore.setState({ nodes: updatedNodes });
          }
          break;
        }

        case "edge_create": {
          // Delete created edges
          const currentEdges = flowStore.edges;
          const filteredEdges = currentEdges.filter(
            (edge) => !action.edgeIds.includes(edge.id)
          );
          useFlowStore.setState({ edges: filteredEdges });
          break;
        }

        case "edge_delete": {
          // Restore deleted edges (only if source and target nodes still exist)
          const currentEdges = flowStore.edges;
          const currentNodes = flowStore.nodes;
          const nodeIds = new Set(currentNodes.map((n) => n.id));

          const restoredEdges: Edge[] = action.edgeSnapshots
            .filter(
              (snapshot) =>
                nodeIds.has(snapshot.source) && nodeIds.has(snapshot.target)
            )
            .map(
              (snapshot) =>
                ({
                  id: snapshot.id,
                  source: snapshot.source,
                  target: snapshot.target,
                  sourceHandle: snapshot.sourceHandle,
                  targetHandle: snapshot.targetHandle,
                  type: snapshot.type || "custom-edge",
                  updatable: true,
                } as Edge)
            );

          // Only restore edges that don't already exist
          const existingEdgeIds = new Set(currentEdges.map((e) => e.id));
          const newEdges = restoredEdges.filter(
            (edge) => !existingEdgeIds.has(edge.id)
          );

          if (newEdges.length > 0) {
            useFlowStore.setState({
              edges: [...currentEdges, ...newEdges],
            });
          }
          break;
        }

        case "edge_reconnect": {
          // Restore old edge
          const currentEdges = flowStore.edges;
          const updatedEdges = currentEdges.map((edge) =>
            edge.id === action.edgeId
              ? {
                  ...edge,
                  source: action.oldEdge.source,
                  target: action.oldEdge.target,
                  sourceHandle: action.oldEdge.sourceHandle,
                  targetHandle: action.oldEdge.targetHandle,
                }
              : edge
          );
          useFlowStore.setState({ edges: updatedEdges });
          break;
        }

        case "paste": {
          // Capture latest state before deleting
          const latestSnapshots = get().createNodeSnapshots(action.nodeIds);
          if (latestSnapshots.length > 0) {
            action.nodeSnapshots = latestSnapshots;
          }

          // Delete pasted nodes (which will also delete their edges)
          action.nodeIds.forEach((nodeId) => {
            flowStore.deleteNode(nodeId);
          });
          break;
        }
      }

      // Move action from undo to redo stack
      const newUndoStack = undoStack.slice(0, -1);
      const newRedoStack = [...redoStack, action];
      if (newRedoStack.length > MAX_HISTORY_SIZE) {
        newRedoStack.shift();
      }

      set({
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        isUndoRedoInProgress: false,
      });

      // Trigger save
      const { canvasId, projectName } = useCanvasMetadataStore.getState();
      triggerCanvasSave(canvasId || undefined, projectName);
    } catch (error) {
      set({ isUndoRedoInProgress: false });
    }
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) {
      return;
    }

    const originalAction = redoStack[redoStack.length - 1];
    let action: UndoRedoAction = originalAction;
    const flowStore = useFlowStore.getState();

    set({ isUndoRedoInProgress: true });

    try {
      switch (action.type) {
        case "node_create": {
          // Re-create nodes
          const restoredNodeIds: string[] = [];
          action.nodeSnapshots.forEach((snapshot) => {
            const nodeId = flowStore.addNode(
              snapshot.type,
              snapshot.position,
              snapshot.data,
              snapshot.id
            );
            restoredNodeIds.push(nodeId);

            // Restore width/height
            if (snapshot.width !== undefined || snapshot.height !== undefined) {
              flowStore.updateNodeDimensions(
                nodeId,
                snapshot.width,
                snapshot.height
              );
            }

            // Restore config
            if (snapshot.config) {
              useConfigStore
                .getState()
                .initializeNodeConfig(nodeId, snapshot.config);
            }
          });

          // Select restored nodes
          if (restoredNodeIds.length > 0) {
            const currentNodes = useFlowStore.getState().nodes;
            const updatedNodes = currentNodes.map((node) =>
              restoredNodeIds.includes(node.id)
                ? { ...node, selected: true }
                : { ...node, selected: false }
            );
            useFlowStore.setState({ nodes: updatedNodes });
          }
          break;
        }

        case "node_delete": {
          // Re-delete nodes
          action.nodeIds.forEach((nodeId) => {
            flowStore.deleteNode(nodeId);
          });
          break;
        }

        case "edge_create": {
          // Re-create edges (only if source and target nodes exist)
          const currentEdges = flowStore.edges;
          const currentNodes = flowStore.nodes;
          const nodeIds = new Set(currentNodes.map((n) => n.id));

          const restoredEdges: Edge[] = action.edgeSnapshots
            .filter(
              (snapshot) =>
                nodeIds.has(snapshot.source) && nodeIds.has(snapshot.target)
            )
            .map(
              (snapshot) =>
                ({
                  id: snapshot.id,
                  source: snapshot.source,
                  target: snapshot.target,
                  sourceHandle: snapshot.sourceHandle,
                  targetHandle: snapshot.targetHandle,
                  type: snapshot.type || "custom-edge",
                  updatable: true,
                } as Edge)
            );

          // Only restore edges that don't already exist
          const existingEdgeIds = new Set(currentEdges.map((e) => e.id));
          const newEdges = restoredEdges.filter(
            (edge) => !existingEdgeIds.has(edge.id)
          );

          if (newEdges.length > 0) {
            useFlowStore.setState({
              edges: [...currentEdges, ...newEdges],
            });
          }
          break;
        }

        case "edge_delete": {
          // Re-delete edges
          const edgeDeleteAction = action as Extract<
            UndoRedoAction,
            { type: "edge_delete" }
          >;
          const currentEdges = flowStore.edges;
          const filteredEdges = currentEdges.filter(
            (edge) => !edgeDeleteAction.edgeIds.includes(edge.id)
          );
          useFlowStore.setState({ edges: filteredEdges });
          break;
        }

        case "edge_reconnect": {
          // Re-apply new edge state
          const edgeReconnectAction = action as Extract<
            UndoRedoAction,
            { type: "edge_reconnect" }
          >;
          const currentEdges = flowStore.edges;
          const updatedEdges = currentEdges.map((edge) =>
            edge.id === edgeReconnectAction.edgeId
              ? {
                  ...edge,
                  source: edgeReconnectAction.newEdge.source,
                  target: edgeReconnectAction.newEdge.target,
                  sourceHandle: edgeReconnectAction.newEdge.sourceHandle,
                  targetHandle: edgeReconnectAction.newEdge.targetHandle,
                }
              : edge
          );
          useFlowStore.setState({ edges: updatedEdges });
          break;
        }

        case "paste": {
          // Re-paste nodes (this is complex, we'll need to recreate from snapshots)
          // For paste, we need to calculate offset from original paste position
          // Since we don't store the paste position, we'll paste at the same relative positions
          const restoredNodeIds: string[] = [];
          const nodeIdMapping = new Map<string, string>();

          action.nodeSnapshots.forEach((snapshot) => {
            const nodeId = flowStore.addNode(
              snapshot.type,
              snapshot.position,
              snapshot.data,
              snapshot.id
            );
            restoredNodeIds.push(nodeId);
            nodeIdMapping.set(snapshot.id, nodeId);

            // Restore width/height
            if (snapshot.width !== undefined || snapshot.height !== undefined) {
              flowStore.updateNodeDimensions(
                nodeId,
                snapshot.width,
                snapshot.height
              );
            }

            // Restore config
            if (snapshot.config) {
              useConfigStore
                .getState()
                .initializeNodeConfig(nodeId, snapshot.config);
            }
          });

          // Restore edges
          const restoredEdgeIds: string[] = [];
          if (action.edgeSnapshots.length > 0) {
            action.edgeSnapshots.forEach((edgeSnapshot) => {
              const newSourceId = nodeIdMapping.get(edgeSnapshot.source);
              const newTargetId = nodeIdMapping.get(edgeSnapshot.target);

              if (newSourceId && newTargetId) {
                const connection: Connection = {
                  source: newSourceId,
                  target: newTargetId,
                  sourceHandle: edgeSnapshot.sourceHandle,
                  targetHandle: edgeSnapshot.targetHandle,
                };

                const currentNodes = useFlowStore.getState().nodes;
                const currentEdges = useFlowStore.getState().edges;
                if (isValidConnection(connection, currentNodes, currentEdges)) {
                  flowStore.onConnect(connection);
                  // Get the newly created edge ID
                  const updatedEdges = useFlowStore.getState().edges;
                  const newEdge = updatedEdges.find(
                    (e) =>
                      e.source === newSourceId &&
                      e.target === newTargetId &&
                      e.sourceHandle === edgeSnapshot.sourceHandle &&
                      e.targetHandle === edgeSnapshot.targetHandle
                  );
                  if (newEdge) {
                    restoredEdgeIds.push(newEdge.id);
                  }
                }
              }
            });
          }

          // Select restored nodes
          if (restoredNodeIds.length > 0) {
            const currentNodes = useFlowStore.getState().nodes;
            const updatedNodes = currentNodes.map((node) =>
              restoredNodeIds.includes(node.id)
                ? { ...node, selected: true }
                : { ...node, selected: false }
            );
            useFlowStore.setState({ nodes: updatedNodes });
          }

          // Update action with new node and edge IDs before moving to undo stack
          // This ensures that when we undo again, we delete the correct nodes
          if (action.type === "paste") {
            action = {
              ...action,
              nodeIds: restoredNodeIds,
              edgeIds: restoredEdgeIds,
            };
          }
          break;
        }
      }

      // Move action from redo to undo stack
      const newRedoStack = redoStack.slice(0, -1);
      const newUndoStack = [...undoStack, action];
      if (newUndoStack.length > MAX_HISTORY_SIZE) {
        newUndoStack.shift();
      }

      set({
        undoStack: newUndoStack,
        redoStack: newRedoStack,
        isUndoRedoInProgress: false,
      });

      // Trigger save
      const { canvasId, projectName } = useCanvasMetadataStore.getState();
      triggerCanvasSave(canvasId || undefined, projectName);
    } catch (error) {
      set({ isUndoRedoInProgress: false });
    }
  },
}));

export default useClipboardStore;
