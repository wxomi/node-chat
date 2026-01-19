export type SaveData = {
  canvasId: string | undefined;
  projectName: string;
  timestamp: number;
};

export type SaveQueueState = {
  // Current in-flight save (request already sent - DON'T cancel)
  currentSave: {
    promise: Promise<void>;
    data: SaveData;
  } | null;

  // Debounce timer ID
  debounceTimer: ReturnType<typeof setTimeout> | null;

  // Only store the LATEST pending save (not a full queue)
  // O(1) memory, O(1) operations
  latestPendingSave: SaveData | null;

  // Is a save currently executing?
  isSaving: boolean;
};
