import { create } from "zustand";

// Task types (use types, not interfaces)
export type TaskStatus = "pending" | "running" | "done" | "failed";

export type Task = {
  id: string; // task id; for now we use nodeId
  nodeId: string;
  nodeType?: string;
  assetName?: string;
  status: TaskStatus;
  startedAt?: number;
  estimateMs?: number;
};

type TaskManagerState = {
  tasksById: Record<string, Task>;
  runningIds: Set<string>;
  runningCount: number;
  showDetails: boolean;
  historySortedByTime: Task[]; // All tasks in chronological order
  // actions
  startNodeTask: (input: {
    nodeId: string;
    nodeType?: string;
    assetName?: string;
    estimateMs?: number;
  }) => string; // returns taskId
  finishNodeTask: (nodeId: string) => void;
  failNodeTask: (nodeId: string) => void;
  resetAll: () => void;
  toggleShowDetails: () => void;
  clearHistory: () => void;
  addMultipleTasks: (
    tasks: Array<{ nodeId: string; nodeType?: string; assetName?: string }>
  ) => void;
};

// A single store instance for all task tracking
export const useTaskManagerStore = create<TaskManagerState>((set, get) => ({
  tasksById: {},
  runningIds: new Set<string>(),
  runningCount: 0,
  showDetails: false,
  historySortedByTime: [],

  startNodeTask: ({ nodeId, nodeType, assetName, estimateMs }) => {
    const existing = get().tasksById[nodeId];
    const now = Date.now();
    const newTask: Task = {
      id: nodeId,
      nodeId,
      nodeType,
      assetName,
      status: "running",
      startedAt: now,
      estimateMs,
    };

    // clone structures to maintain immutability guarantees for subscribers
    const nextTasks = { ...get().tasksById, [nodeId]: newTask };
    const nextRunning = new Set(get().runningIds);
    if (!nextRunning.has(nodeId)) {
      nextRunning.add(nodeId);
    }

    // Increment runningCount only if:
    // 1. This is a NEW task (no existing), OR
    // 2. The existing task was in a terminal state (done/failed) and is now restarting
    const wasTerminal =
      existing && (existing.status === "done" || existing.status === "failed");
    const increment = !existing || wasTerminal ? 1 : 0;

    // Prepend to history if new task (newest first)
    const history = existing
      ? get().historySortedByTime.map((t) =>
          t.nodeId === nodeId ? newTask : t
        )
      : [newTask, ...get().historySortedByTime];

    set({
      tasksById: nextTasks,
      runningIds: nextRunning,
      runningCount: get().runningCount + increment,
      historySortedByTime: history,
    });

    return nodeId;
  },

  finishNodeTask: (nodeId: string) => {
    const task = get().tasksById[nodeId];
    if (!task) {
      // If task not found, decrement runningCount as it was never started
      set((state) => ({ runningCount: Math.max(0, state.runningCount - 1) }));
      return;
    }

    const updatedTask = { ...task, status: "done" as const };
    const nextTasks = {
      ...get().tasksById,
      [nodeId]: updatedTask,
    };
    const nextRunning = new Set(get().runningIds);
    let delta = 0;
    if (nextRunning.has(nodeId)) {
      nextRunning.delete(nodeId);
      delta = -1;
    }

    // Update history
    const nextHistory = get().historySortedByTime.map((t) =>
      t.nodeId === nodeId ? updatedTask : t
    );

    set({
      tasksById: nextTasks,
      runningIds: nextRunning,
      runningCount: Math.max(0, get().runningCount + delta),
      historySortedByTime: nextHistory,
    });
  },

  failNodeTask: (nodeId: string) => {
    const task = get().tasksById[nodeId];
    if (!task) {
      set((state) => ({ runningCount: Math.max(0, state.runningCount - 1) }));
      return;
    }

    const updatedTask = { ...task, status: "failed" as const };
    const nextTasks = {
      ...get().tasksById,
      [nodeId]: updatedTask,
    };
    const nextRunning = new Set(get().runningIds);
    let delta = 0;
    if (nextRunning.has(nodeId)) {
      nextRunning.delete(nodeId);
      delta = -1;
    }

    // Update history
    const nextHistory = get().historySortedByTime.map((t) =>
      t.nodeId === nodeId ? updatedTask : t
    );

    set({
      tasksById: nextTasks,
      runningIds: nextRunning,
      runningCount: Math.max(0, get().runningCount + delta),
      historySortedByTime: nextHistory,
    });
  },

  resetAll: () => {
    set({
      tasksById: {},
      runningIds: new Set<string>(),
      runningCount: 0,
      historySortedByTime: [],
    });
  },

  toggleShowDetails: () => {
    set((state) => ({ showDetails: !state.showDetails }));
  },

  clearHistory: () => {
    set({ historySortedByTime: [], tasksById: {} });
  },

  addMultipleTasks: (
    tasks: Array<{ nodeId: string; nodeType?: string; assetName?: string }>
  ) => {
    const now = Date.now();
    const newTasks: Task[] = tasks.map((task) => ({
      id: task.nodeId,
      nodeId: task.nodeId,
      nodeType: task.nodeType,
      assetName: task.assetName,
      status: "pending",
      startedAt: now,
    }));

    const nextTasks = {
      ...get().tasksById,
      ...newTasks.reduce((acc, task) => ({ ...acc, [task.nodeId]: task }), {}),
    };
    const nextRunning = new Set(get().runningIds);
    newTasks.forEach((task) => {
      if (!nextRunning.has(task.nodeId)) {
        nextRunning.add(task.nodeId);
      }
    });

    const history = [...newTasks, ...get().historySortedByTime];

    set({
      tasksById: nextTasks,
      runningIds: nextRunning,
      runningCount: get().runningCount + newTasks.length,
      historySortedByTime: history,
    });
  },
}));

// Selectors/hooks to minimize re-renders
export const useTaskRunningCount = () =>
  useTaskManagerStore((s) => s.runningCount);

export const useShowTaskDetails = () =>
  useTaskManagerStore((s) => s.showDetails);

export const useRunningTasks = () =>
  useTaskManagerStore((s) => {
    const running = Array.from(s.runningIds).map((id) => s.tasksById[id]);
    return running.filter(Boolean);
  });

export const useTaskHistory = () =>
  useTaskManagerStore((s) => s.historySortedByTime);

// Helper for single-node runs (can be used by node generate buttons)
export async function trackSingleNodeRun(
  nodeId: string,
  nodeType: string | undefined,
  run: () => Promise<void>
): Promise<void> {
  const { startNodeTask, finishNodeTask, failNodeTask } =
    useTaskManagerStore.getState();
  startNodeTask({ nodeId, nodeType });
  try {
    await run();
    finishNodeTask(nodeId);
  } catch (e) {
    failNodeTask(nodeId);
    throw e;
  }
}
