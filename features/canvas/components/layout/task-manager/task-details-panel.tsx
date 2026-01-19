"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  useShowTaskDetails,
  useTaskManagerStore,
} from "@/features/canvas/stores/task-manager-store";
import useFlowStore from "@/features/canvas/stores/canvas-store";
import { BATCHABLE_NODE_TYPES } from "@/features/canvas/constants/batch/batch-config-constants";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type TaskDetailsPanelProps = {
  className?: string;
};

const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({ className }) => {
  const showDetails = useShowTaskDetails();
  const toggleShowDetails = useTaskManagerStore((s) => s.toggleShowDetails);
  const taskHistory = useTaskManagerStore((s) => s.historySortedByTime);
  const clearHistory = useTaskManagerStore((s) => s.clearHistory);
  const nodes = useFlowStore((s) => s.nodes);

  // Get all selected nodes from React Flow's selected property
  const selectedNodes = React.useMemo(() => {
    return nodes.filter((node) => node.selected === true);
  }, [nodes]);

  const selectedNodeIds = selectedNodes.map((node) => node.id);
  const isMultipleSelected = selectedNodeIds.length > 1;
  const isSingleSelected = selectedNodeIds.length === 1;

  // For single node, get the node for config sheet check
  const selectedNode = isSingleSelected ? selectedNodes[0] : null;

  // Check if all selected nodes are batchable (have generate handlers)
  const allSelectedNodesAreBatchable = selectedNodes.every(
    (node) => node.type && BATCHABLE_NODE_TYPES.includes(node.type)
  );

  // Only consider sidebar "open" if it will actually render content
  const isConfigSidebarOpen =
    (isSingleSelected && selectedNode?.data?.configOptions === true) ||
    (isMultipleSelected && allSelectedNodesAreBatchable);

  // Calculate right offset: 280px for config sidebar + 16px gap when open, otherwise 16px
  const rightOffset = isConfigSidebarOpen
    ? "calc(280px + 120px + 32px)"
    : "calc(120px + 16px)";

  // History is already in reverse chronological order (newest first)
  const sortedHistory = taskHistory;

  // Map node types to display names
  const getNodeName = (nodeType?: string) => {
    const nameMap: Record<string, string> = {
      "text-node": "Prompt",
      "prompt-enhancer-node": "Prompt Enhancer",
      "upload-node": "Upload Media",
      "image-generator-node": "Generate Image",
      "ai-image-editor-node": "Edit Image",
      "ai-image-upscaler-node": "Upscale Image",
      "remove-background-node": "Remove Background",
      "face-swap-node": "Swap Face",
      "video-generator-node": "Generate Video",
      "animation-node": "Create Animation",
      "face-swap-video-node": "Swap Face",
      "lip-sync-node": "Sync Lips to Audio",
      "ai-voice-generator-node": "Generate Voice",
    };
    return nameMap[nodeType || ""] || nodeType || "Unknown";
  };

  // Status badge styling
  const statusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      running: "bg-blue-500/20 text-blue-400",
      done: "bg-emerald-500/20 text-emerald-400",
      failed: "bg-red-500/20 text-red-400",
      pending: "bg-muted text-muted-foreground",
    };
    return colorMap[status] || "bg-muted text-muted-foreground";
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return <Loader2 size={12} className="animate-spin" />;
      case "done":
        return <CheckCircle2 size={12} />;
      case "failed":
        return <AlertCircle size={12} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {showDetails && (
        <>
          {/* Backdrop to close panel on outside click */}
          <div className="fixed inset-0 z-[9998]" onClick={toggleShowDetails} />
          <motion.div
            initial={{ opacity: 0, scaleX: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleX: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleX: 0, scaleY: 0, filter: "blur(4px)" }}
            transition={{
              opacity: { duration: 0.1, ease: "easeIn" },
              scaleX: { duration: 0.2, ease: "easeOut" },
              scaleY: { duration: 0.2, ease: "easeOut" },
            }}
            style={{ transformOrigin: "top right", right: rightOffset }}
            className={
              "fixed top-6 w-72 py-4 rounded-md bg-sidebar-background border border-border shadow-lg text-xs text-white max-h-80 overflow-y-auto flex flex-col gap-3 z-[9999] " +
              (className ? className : "")
            }
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2 border-b border-border pb-4 px-4">
              <span className="font-semibold text-caption-desktop-medium">
                Task Manager
              </span>
              <button
                onClick={clearHistory}
                className="text-[10px] px-2 py-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                Clear All
              </button>
            </div>

            {sortedHistory.length === 0 ? (
              <span className="text-muted-foreground px-4">
                No running tasks
              </span>
            ) : (
              <motion.div
                className="flex flex-col gap-6 px-4"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05,
                    },
                  },
                }}
              >
                {sortedHistory.map((task) => (
                  <motion.div
                    key={task.nodeId}
                    className=""
                    initial={false}
                    animate="visible"
                    exit="exit"
                    variants={{
                      hidden: {
                        opacity: 0,
                        x: 20,
                        filter: "blur(4px)",
                      },
                      visible: {
                        opacity: 1,
                        x: 0,
                        filter: "blur(0px)",
                        transition: {
                          duration: 0.2,
                          ease: "easeOut",
                        },
                      },
                      exit: {
                        opacity: 0,
                        x: 20,
                        filter: "blur(8px)",
                        transition: {
                          duration: 0.08,
                          ease: "easeIn",
                        },
                      },
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-medium text-xs">
                        {getNodeName(task.nodeType)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ml-auto ${statusBadge(
                          task.status
                        )}`}
                      >
                        {task.status.charAt(0).toUpperCase() +
                          task.status.slice(1)}
                        {getStatusIcon(task.status)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskDetailsPanel;
