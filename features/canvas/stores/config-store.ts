import { create } from "zustand";
import { triggerCanvasSave } from "../lib/canvas";
import useCanvasMetadataStore from "./canvas-metadata-store";
import useClipboardStore from "./clipboard-store";

export interface UIState {
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  nodeConfigs: Record<string, any>;
  settingsNodeId: string | null;
  panelStates: Record<string, boolean>; // Track if each node's panel was maximized
  setSelectedNodeId: (nodeId: string | null) => void;
  setSelectedNodeIds: (nodeIds: string[]) => void;
  setSettingsNodeId: (nodeId: string | null) => void;
  updateNodeConfig: (nodeId: string, config: Partial<any>) => void;
  initializeNodeConfig: (nodeId: string, defaultConfig: any) => void;
}

const useConfigStore = create<UIState>((set, get) => ({
  selectedNodeId: null,
  selectedNodeIds: [],
  nodeConfigs: {},
  settingsNodeId: null,
  panelStates: {},

  setSelectedNodeId: (nodeId: string | null) => {
    const state = get();
    const currentSettingsNodeId = state.settingsNodeId;
    const currentSelectedNodeId = state.selectedNodeId;

    if (nodeId === null) {
      // Deselecting - store current panel state before clearing
      if (currentSelectedNodeId !== null) {
        // Store the panel state for the node being deselected
        const wasMaximized = currentSettingsNodeId === currentSelectedNodeId;
        set({
          selectedNodeId: null,
          settingsNodeId: null,
          panelStates: {
            ...state.panelStates,
            [currentSelectedNodeId]: wasMaximized, // Remember panel state
          },
        });
      } else {
        set({
          selectedNodeId: null,
          settingsNodeId: null,
        });
      }
    } else if (
      currentSelectedNodeId !== null &&
      currentSelectedNodeId !== nodeId
    ) {
      // Switching to a different node - inherit previous node's panel state
      // Check if previous node's panel was maximized
      const wasMaximized = currentSettingsNodeId === currentSelectedNodeId;
      // Inherit the panel state: if previous was maximized, new node starts maximized
      set({
        selectedNodeId: nodeId,
        settingsNodeId: wasMaximized ? nodeId : null,
        panelStates: {
          ...state.panelStates,
          [currentSelectedNodeId]: wasMaximized, // Remember previous node's panel state
          [nodeId]: wasMaximized, // Update new node's state to match inherited state
        },
      });
    } else {
      // Same node re-selected or first selection - restore its stored panel state
      const wasMaximized = state.panelStates[nodeId] ?? false;
      set({
        selectedNodeId: nodeId,
        settingsNodeId: wasMaximized ? nodeId : null,
      });
    }
  },

  setSelectedNodeIds: (nodeIds: string[]) => {
    set({ selectedNodeIds: nodeIds });
  },

  // set node id for the advanced settings panel
  setSettingsNodeId: (nodeId: string | null) => {
    const state = get();
    // Store panel state: maximized if nodeId is set, minimized if null
    if (nodeId !== null) {
      // Maximizing - store that this node's panel is maximized
      set({
        settingsNodeId: nodeId,
        panelStates: {
          ...state.panelStates,
          [nodeId]: true,
        },
      });
    } else {
      // Minimizing - store that current node's panel is minimized
      const current = state.settingsNodeId;
      if (current !== null) {
        set({
          settingsNodeId: null,
          panelStates: {
            ...state.panelStates,
            [current]: false,
          },
        });
      } else {
        set({ settingsNodeId: null });
      }
    }
  },

  updateNodeConfig: (nodeId: string, config: Partial<any>) => {
    const state = get();
    const prevConfig = state.nodeConfigs[nodeId] || {};
    const nextConfig = {
      ...prevConfig,
      ...config,
    };

    // Record config change for undo/redo BEFORE updating state
    const { isUndoRedoInProgress } = useClipboardStore.getState();
    if (!isUndoRedoInProgress) {
      useClipboardStore.getState().recordNodeConfigUpdate(nodeId, prevConfig, nextConfig);
    }

    set((state) => ({
      nodeConfigs: {
        ...state.nodeConfigs,
        [nodeId]: nextConfig,
      },
    }));

    // Trigger save after node config is updated
    const { canvasId, projectName } = useCanvasMetadataStore.getState();
    triggerCanvasSave(canvasId || undefined, projectName);
  },

  initializeNodeConfig: (nodeId: string, defaultConfig: any) => {
    set((state) => ({
      nodeConfigs: {
        ...state.nodeConfigs,
        [nodeId]: { ...defaultConfig },
      },
    }));
  },
}));

export default useConfigStore;
