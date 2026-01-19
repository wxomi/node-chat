"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import GenerateButton from "../shared/generate-button/generate-button";
import {
  NODE_TYPE_ICONS,
  BATCHABLE_NODE_TYPES,
} from "../../constants/batch/batch-config-constants";
import {
  handleBatchGenerate,
  type BatchNodeStatus,
} from "../../handlers/batch";
import { estimateMsForNode, formatEta } from "../../lib/shared";

type BatchConfigSheetProps = {
  selectedNodeIds: string[];
};

const getNodeDisplayName = (nodeType: string): string => {
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

  return nameMap[nodeType] || nodeType;
};

const BatchConfigSheet: React.FC<BatchConfigSheetProps> = ({
  selectedNodeIds,
}) => {
  // Filter to only batchable nodes (safety check)
  const batchableNodeIds = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    return selectedNodeIds.filter((id) => {
      const node = nodes.find((n) => n.id === id);
      return node?.type && BATCHABLE_NODE_TYPES.includes(node.type);
    });
  }, [selectedNodeIds]);

  const selectedNodesInfo = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    return batchableNodeIds
      .map((id) => {
        const node = nodes.find((n) => n.id === id);
        return {
          id,
          type: node?.type || "unknown",
          displayName: getNodeDisplayName(node?.type || "unknown"),
          icon: NODE_TYPE_ICONS[node?.type || "unknown"],
        };
      })
      .filter((info) => info.type !== "unknown");
  }, [batchableNodeIds]);

  const [statusMap, setStatusMap] = useState<Record<string, BatchNodeStatus>>(
    () => {
      const initial: Record<string, BatchNodeStatus> = {};
      return initial;
    }
  );

  // Reset status map when batchableNodeIds changes
  useEffect(() => {
    const initial: Record<string, BatchNodeStatus> = {};
    for (const id of batchableNodeIds) {
      initial[id] = "pending";
    }
    setStatusMap(initial);
  }, [batchableNodeIds]);

  const nodeConfigs = useConfigStore((s) => s.nodeConfigs);

  const estimatedList = useMemo(() => {
    const nodes = useFlowStore.getState().nodes;
    return batchableNodeIds.map((id) => {
      const node = nodes.find((n) => n.id === id);
      const ms = estimateMsForNode({
        nodeType: node?.type || "",
        nodeConfig: nodeConfigs?.[id],
      });
      return { id, ms };
    });
  }, [batchableNodeIds, nodeConfigs]);

  const totalMs = useMemo(
    () => estimatedList.reduce((acc, x) => acc + (x.ms || 0), 0),
    [estimatedList]
  );

  const isRunning = useMemo(
    () => Object.values(statusMap).some((s) => s === "running"),
    [statusMap]
  );

  const handleGenerateSelected = useCallback(async () => {
    // reset statuses
    setStatusMap((prev) => {
      const next: Record<string, BatchNodeStatus> = {};
      for (const id of batchableNodeIds) next[id] = "pending";
      return next;
    });

    await handleBatchGenerate(batchableNodeIds, {
      onStatus: (nodeId, status) =>
        setStatusMap((prev) => ({ ...prev, [nodeId]: status })),
    });
  }, [batchableNodeIds]);

  const statusBadge = (status: BatchNodeStatus) => {
    const map: Record<BatchNodeStatus, string> = {
      pending: "bg-muted text-muted-foreground",
      running: "bg-blue-500/20 text-blue-400",
      done: "bg-emerald-500/20 text-emerald-400",
      failed: "bg-red-500/20 text-red-400",
    };
    const label: Record<BatchNodeStatus, string> = {
      pending: "Pending",
      running: "Running",
      done: "Done",
      failed: "Failed",
    };
    return (
      <span className={`text-[8px] px-1.5 rounded-sm ${map[status]}`}>
        {label[status]}
      </span>
    );
  };

  return (
    <div className="py-6 h-full w-full overflow-auto flex flex-col gap-6">
      <div className="border-b border-border pb-4 px-4">
        <h2 className="text-[14px] font-semibold tracking-tight">
          Generate Selected
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {batchableNodeIds.length} selected
        </p>
      </div>

      {/* Selected nodes list */}
      <div className="flex flex-col gap-2 px-4">
        <div className="space-y-4">
          {selectedNodesInfo.map((nodeInfo) => {
            const est = estimatedList.find((e) => e.id === nodeInfo.id)?.ms;
            return (
              <div key={nodeInfo.id} className="flex-col items-center gap-2">
                <div className="flex items-center gap-3 py-2 px-3 rounded-md bg-muted border border-border text-caption-desktop-regular ">
                  {nodeInfo.icon && (
                    <Image
                      src={nodeInfo.icon}
                      alt={nodeInfo.displayName}
                      width={12}
                      height={12}
                      className="flex-shrink-0 brightness-0 invert"
                    />
                  )}
                  <p className="text-xs font-medium text-foreground">
                    {nodeInfo.displayName}
                  </p>
                  <div className="ml-auto flex items-center gap-3">
                    {statusBadge(statusMap[nodeInfo.id] || "pending")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      <div className="border-t border-border pt-4 px-4 mt-auto">
        {totalMs > 0 && (
          <div className="text-[11px] text-muted-foreground mb-4 flex items-center justify-between">
            Total estimated time:{" "}
            <span className="font-medium text-foreground">
              {formatEta(totalMs)}
            </span>
          </div>
        )}
        <GenerateButton
          onClick={handleGenerateSelected}
          isLoading={isRunning}
          disabled={isRunning}
          className="w-full h-[32px]"
          label={isRunning ? "Running..." : "Generate Selected"}
        />
      </div>
    </div>
  );
};

export default React.memo(BatchConfigSheet);
