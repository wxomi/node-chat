import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import useWalkthroughStore from "../../stores/walkthrough-store";
import useCanvasMetadataStore from "../../stores/canvas-metadata-store";
import {
  saveCanvasToDatabase,
  loadCanvasFromDatabase,
} from "../../services/canvas";
import type { CanvasSaveData } from "../../types/canvas.types";
import type {
  SaveData,
  SaveQueueState,
} from "../../types/canvas-save-queue.types";
import {
  validateCanvasSaveData,
  safeValidateCanvasSaveData,
} from "../../validations/canvas";

// Re-export for convenience
export type { CanvasSaveData };

const queueState: SaveQueueState = {
  currentSave: null,
  debounceTimer: null,
  latestPendingSave: null,
  isSaving: false,
};

const DEBOUNCE_MS = 500;

/**
 * Get current canvas state for saving using rfInstance.toObject()
 * Much cleaner and more reliable than manual serialization
 */
export function getCanvasState(
  canvasId: string | undefined,
  projectName: string
): CanvasSaveData {
  const rfInstance = useFlowStore.getState().rfInstance;
  const nodeConfigs = useConfigStore.getState().nodeConfigs;
  // Invert: isActive true (show) → walkthrough false (not completed)
  //         isActive false (hide) → walkthrough true (completed)
  const walkthrough = !useWalkthroughStore.getState().isActive;

  // Use ReactFlow's built-in serialization
  // This handles all edge cases and ensures proper format
  const graphIndex = rfInstance
    ? rfInstance.toObject()
    : { nodes: [], edges: [] };

  // Get viewport separately if available
  const viewport = rfInstance?.getViewport();

  const canvasData = {
    id: canvasId,
    name: projectName,
    graphIndex: {
      nodes: graphIndex.nodes || [],
      edges: graphIndex.edges || [],
      viewport: viewport
        ? { x: viewport.x, y: viewport.y, zoom: viewport.zoom }
        : undefined,
    },
    walkthrough,
    nodeConfigs: { ...nodeConfigs },
    updatedAt: new Date().toISOString(),
  };

  // Validate before returning (ensures data integrity before saving)
  return validateCanvasSaveData(canvasData);
}

/**
 * Clear debounce timer - O(1)
 */
function clearDebounceTimer(): void {
  if (queueState.debounceTimer) {
    clearTimeout(queueState.debounceTimer);
    queueState.debounceTimer = null;
  }
}

/**
 * Execute the actual save operation
 * O(1) - no recursion, no queue traversal
 */
async function performSave(
  canvasId: string | undefined,
  projectName: string
): Promise<void> {
  const saveStartTime = Date.now();
  const saveData: SaveData = {
    canvasId,
    projectName,
    timestamp: saveStartTime,
  };

  // Mark as saving
  queueState.isSaving = true;

  // Get fresh canvas state using rfInstance.toObject()
  const canvasData = getCanvasState(canvasId, projectName);

  // Store current save (request is now in-flight, don't cancel)
  const savePromise = saveCanvasToDatabase(canvasData);
  queueState.currentSave = {
    promise: savePromise,
    data: saveData,
  };

  try {
    // Wait for save to complete
    await savePromise;

    // Clear current save
    queueState.currentSave = null;
    queueState.isSaving = false;

    // Check if there's a pending save (O(1) check)
    const pendingSave = queueState.latestPendingSave;
    if (pendingSave) {
      // Clear pending (O(1))
      queueState.latestPendingSave = null;

      // Process the pending save (non-recursive - uses event loop)
      // This prevents potential stack overflow and is more performant
      setImmediate(() => {
        performSave(pendingSave.canvasId, pendingSave.projectName).catch(
          (error) => {
            console.error(
              "[Canvas Save Queue] Error processing pending save:",
              error
            );
            queueState.isSaving = false;
            queueState.currentSave = null;
          }
        );
      });
    }
  } catch (error) {
    // Handle error
    console.error("[Canvas Save Queue] Save failed:", error);

    queueState.currentSave = null;
    queueState.isSaving = false;

    // Even on error, check for pending save
    const pendingSave = queueState.latestPendingSave;
    if (pendingSave) {
      // Clear pending (O(1))
      queueState.latestPendingSave = null;

      // Process pending save
      setImmediate(() => {
        performSave(pendingSave.canvasId, pendingSave.projectName).catch(
          (error) => {
            console.error(
              "[Canvas Save Queue] Error processing pending save after error:",
              error
            );
            queueState.isSaving = false;
            queueState.currentSave = null;
          }
        );
      });
    }
  }
}

/**
 * Public API: Trigger a save (debounced, latest-only queue)
 * O(1) - constant time operations only
 */
export function triggerCanvasSave(
  canvasId: string | undefined,
  projectName: string
): void {
  const saveData: SaveData = {
    canvasId,
    projectName,
    timestamp: Date.now(),
  };

  // If a save is currently in progress (request already sent)
  if (queueState.isSaving && queueState.currentSave) {
    // O(1) - just overwrite the latest pending save
    queueState.latestPendingSave = saveData;
    return; // Don't start a new save, just store it
  }

  // Clear any existing debounce timer (O(1))
  clearDebounceTimer();

  queueState.debounceTimer = setTimeout(() => {
    queueState.debounceTimer = null;

    // Double-check we're not saving (might have started during debounce)
    if (queueState.isSaving && queueState.currentSave) {
      // O(1) - just overwrite
      queueState.latestPendingSave = saveData;
      return;
    }

    // Process the save
    performSave(saveData.canvasId, saveData.projectName).catch((error) => {
      console.error("[Canvas Save Queue] Error in debounced save:", error);
      queueState.isSaving = false;
      queueState.currentSave = null;
    });
  }, DEBOUNCE_MS);
}

/**
 * Public API: Force immediate save (bypasses debounce and queue)
 * Use for explicit save actions or on exit
 * O(1) - constant time operations
 */
export async function forceCanvasSave(
  canvasId: string | undefined,
  projectName: string
): Promise<void> {
  // Clear debounce timer (O(1))
  clearDebounceTimer();

  // Clear pending save (O(1))
  queueState.latestPendingSave = null;

  const saveData: SaveData = {
    canvasId,
    projectName,
    timestamp: Date.now(),
  };

  // If a save is in progress, wait for it, then execute this one
  if (queueState.isSaving && queueState.currentSave) {
    // Wait for current save to complete
    try {
      await queueState.currentSave.promise;
    } catch (error) {
      // Ignore errors from previous save
    }
    // Now execute the forced save
    await performSave(saveData.canvasId, saveData.projectName);
  } else {
    // No save in progress, execute immediately
    await performSave(saveData.canvasId, saveData.projectName);
  }
}

/**
 * Public API: Wait for all pending saves to complete
 * Useful before navigation or app exit
 * O(1) - just checks and processes latest
 */
export async function waitForPendingSaves(): Promise<void> {
  // Wait for current save to complete
  if (queueState.currentSave) {
    try {
      await queueState.currentSave.promise;
    } catch (error) {
      // Ignore errors
    }
  }

  // Process latest pending save if exists (O(1))
  const pendingSave = queueState.latestPendingSave;
  if (pendingSave) {
    queueState.latestPendingSave = null; // O(1)
    await performSave(pendingSave.canvasId, pendingSave.projectName);
  }
}

/**
 * Public API: Get queue state (for debugging/monitoring)
 * O(1) - constant time
 */
export function getQueueState() {
  return {
    isSaving: queueState.isSaving,
    currentSaveTimestamp: queueState.currentSave?.data.timestamp,
    hasPendingSave: queueState.latestPendingSave !== null,
    pendingTimestamp: queueState.latestPendingSave?.timestamp,
  };
}

/**
 * Public API: Load canvas from backend
 * Delegates to canvas-service.ts for actual API call
 */
export async function performCanvasLoad(
  canvasId: string
): Promise<CanvasSaveData | null> {
  return loadCanvasFromDatabase(canvasId);
}

/**
 * Public API: Restore canvas and node configs from loaded data
 */
export function restoreCanvas(data: unknown): void {
  // Validate data from backend before restoring (can't trust external data)
  const validationResult = safeValidateCanvasSaveData(data);

  if (!validationResult.success) {
    console.error(
      "[Canvas Save Queue] Invalid canvas data:",
      validationResult.error.issues
    );
    throw new Error(
      `Invalid canvas data: ${validationResult.error.issues
        .map((e: { message: string }) => e.message)
        .join(", ")}`
    );
  }

  const validatedData = validationResult.data;
  const { graphIndex, nodeConfigs } = validatedData;

  // Restore nodes and edges using ReactFlow's methods
  const rfInstance = useFlowStore.getState().rfInstance;
  if (rfInstance && graphIndex) {
    // Use ReactFlow's built-in restoration
    rfInstance.setNodes(graphIndex.nodes || []);
    rfInstance.setEdges(graphIndex.edges || []);

    // Restore viewport if available
    if (graphIndex.viewport) {
      rfInstance.setViewport(graphIndex.viewport, { duration: 0 });
    }
  } else {
    // Fallback: restore via store if rfInstance not available
    useFlowStore.getState().resetFlow();
    useFlowStore.setState({
      nodes: graphIndex.nodes || [],
      edges: graphIndex.edges || [],
    });
  }

  // Restore node configs
  Object.entries(nodeConfigs).forEach(([nodeId, config]) => {
    useConfigStore.getState().initializeNodeConfig(nodeId, config);
  });

  // Restore walkthrough state
  // Invert: walkthrough false (not completed) → isActive true (show)
  //         walkthrough true (completed) → isActive false (hide)
  if (validatedData.walkthrough !== undefined) {
    useWalkthroughStore.getState().setIsActive(!validatedData.walkthrough);
  }

  // Set metadata store values from loaded canvas
  useCanvasMetadataStore.getState().setCanvasId(validatedData.id || null);
  useCanvasMetadataStore.getState().setProjectName(validatedData.name);
}

/**
 * Public API: Cleanup (for testing or explicit cleanup)
 */
export function cleanupCanvasSave(): void {
  clearDebounceTimer();
  queueState.latestPendingSave = null;
  queueState.isSaving = false;
  queueState.currentSave = null;
}
