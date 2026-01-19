"use client";

import React, { useEffect, useRef } from "react";
import { AnimatePresence, motion, LayoutGroup } from "motion/react";
import { Panel } from "@xyflow/react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import useFlowStore from "@/features/canvas/stores/canvas-store";
import { useTaskRunningCount } from "@/features/canvas/stores/task-manager-store";
import { useTaskManagerStore } from "@/features/canvas/stores/task-manager-store";
import { useShowTaskDetails } from "@/features/canvas/stores/task-manager-store";
import { BATCHABLE_NODE_TYPES } from "@/features/canvas/constants/batch/batch-config-constants";

type TaskManagerPrototypeProps = {
  className?: string;
};

const TaskManagerPrototype: React.FC<TaskManagerPrototypeProps> = ({
  className,
}) => {
  const runningCount = useTaskRunningCount();
  const showDetails = useShowTaskDetails();
  const toggleShowDetails = useTaskManagerStore((s) => s.toggleShowDetails);
  const taskHistory = useTaskManagerStore((s) => s.historySortedByTime);
  const clearHistory = useTaskManagerStore((s) => s.clearHistory);

  const ref = useRef<HTMLDivElement>(null);

  // Get all selected nodes from React Flow's selected property
  const nodes = useFlowStore((state) => state.nodes);
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

  // Calculate right offset: move left when config sidebar is actually open (280px + 16px gap)
  const rightOffset = isConfigSidebarOpen ? 280 + 16 : 16;

  // Handle escape key and outside click
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showDetails) {
        toggleShowDetails();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDetails, toggleShowDetails]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        if (showDetails) {
          toggleShowDetails();
        }
      }
    };

    if (showDetails) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [showDetails, toggleShowDetails]);

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
        return <Loader2 className="animate-spin" size={12} />;
      case "done":
        return <CheckCircle2 size={12} />;
      case "failed":
        return <AlertCircle size={12} />;
      default:
        return null;
    }
  };

  return (
    <div ref={ref} className="contents">
      <LayoutGroup>
        <AnimatePresence mode="wait">
          {!showDetails ? (
            <Panel
              key="button"
              position="top-right"
              style={{ right: `${rightOffset}px` }}
            >
              <motion.button
                layout
                layoutId="task-manager-wrapper"
                onClick={() => toggleShowDetails()}
                style={{ borderRadius: 6 }}
                className="px-3 py-1.5 shadow-sm text-xs text-white flex items-center gap-2 cursor-pointer bg-accent"
              >
                <motion.span layout layoutId="task-manager-title">
                  {runningCount === 0
                    ? "No active runs"
                    : `Running: ${runningCount}`}
                </motion.span>
              </motion.button>
            </Panel>
          ) : (
            <Panel
              key="panel"
              position="top-right"
              style={{ right: `${rightOffset}px` }}
            >
              <motion.div
                layout
                layoutId="task-manager-wrapper"
                style={{ borderRadius: 6 }}
                className="w-72 bg-accent shadow-lg text-xs text-white flex flex-col pb-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border">
                  <motion.span
                    layout
                    layoutId="task-manager-title"
                    className="font-semibold text-caption-desktop-medium"
                  >
                    {runningCount === 0
                      ? "No active runs"
                      : `Running: ${runningCount}`}
                  </motion.span>
                  <button
                    onClick={clearHistory}
                    className="text-[10px] px-2 py-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </button>
                </div>

                <div className="overflow-y-auto flex flex-col gap-3 mt-2">
                  {taskHistory.length === 0 ? (
                    <motion.span
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-muted-foreground px-4 py-2"
                    >
                      No running tasks
                    </motion.span>
                  ) : (
                    <motion.div
                      layout
                      className="flex flex-col gap-6 px-4 py-3"
                      initial="hidden"
                      animate="visible"
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.05,
                            delayChildren: 0.2,
                          },
                        },
                      }}
                    >
                      {taskHistory.map((task) => (
                        <motion.div
                          layout
                          key={task.nodeId}
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
                </div>
              </motion.div>
            </Panel>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div>
  );
};

export default TaskManagerPrototype;

