"use client";

import React from "react";
import { Panel } from "@xyflow/react";
import useFlowStore from "@/features/canvas/stores/canvas-store";
import { useTaskRunningCount } from "@/features/canvas/stores/task-manager-store";
import { useTaskManagerStore } from "@/features/canvas/stores/task-manager-store";
import { useShowTaskDetails } from "@/features/canvas/stores/task-manager-store";
import { BATCHABLE_NODE_TYPES } from "@/features/canvas/constants/batch/batch-config-constants";

type TaskPanelProps = {
  className?: string;
};

const TaskPanel: React.FC<TaskPanelProps> = ({ className }) => {
  const runningCount = useTaskRunningCount();
  const showDetails = useShowTaskDetails();
  const toggleShowDetails = useTaskManagerStore((s) => s.toggleShowDetails);

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
  const rightOffset = isConfigSidebarOpen ? 280 + 16 : 0;

  return (
    <Panel
      position="top-right"
      style={{ right: `${rightOffset}px`, top: "10px" }}
      className={
        "px-3 py-1.5 rounded-md border shadow-sm text-xs text-white flex items-center gap-2 cursor-pointer transition-all " +
        (showDetails
          ? "bg-accent border-accent"
          : "bg-sidebar-background border-border") +
        (className ? " " + className : "")
      }
      onClick={toggleShowDetails}
    >
      <span
        className={showDetails ? "" : runningCount > 0 ? "animate-pulse" : ""}
      >
        {runningCount === 0 ? "No active runs" : `Running: ${runningCount}`}
      </span>
    </Panel>
  );
};

export default TaskPanel;
