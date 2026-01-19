"use client";

import useFlowStore from "../../stores/canvas-store";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import {
  buildDependencyGraph,
  topologicalSort,
  getWorkflows,
} from "../../lib/batch";

import { handleImageGenerate } from "../image";
import { handleAIImageEdit } from "../image";
import { handleUpscaleImage } from "../image";
import { handleRemoveBackground } from "../image";
import { handleFaceSwap } from "../image";
import { handleGenerateVideo } from "../video";
import { handleGenerateAnimation } from "../video";
import { handleFaceSwapVideo } from "../video";
import { handleLipSync } from "../video";
import { handleVoiceGenerate } from "../audio";
import { useTaskManagerStore } from "../../stores/task-manager-store";

export type BatchNodeStatus = "pending" | "running" | "done" | "failed";

type StatusCallback = (nodeId: string, status: BatchNodeStatus) => void;

export async function handleBatchGenerate(
  nodeIds: string[],
  opts?: { onStatus?: StatusCallback }
): Promise<void> {
  const { success, error, showLoading, dismiss } = useOperationToasts();

  if (!nodeIds || nodeIds.length === 0) return;

  const uniqueIds = Array.from(new Set(nodeIds));
  const { edges, nodes } = useFlowStore.getState();

  // Add all tasks to history upfront
  const tasksToAdd = uniqueIds.map((nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    return { nodeId, nodeType: node?.type };
  });
  useTaskManagerStore.getState().addMultipleTasks(tasksToAdd);

  // Partition into disconnected workflows
  const workflows = getWorkflows(uniqueIds, edges);

  const toastId = showLoading("Starting...");
  let firstStarted = false;

  // Prepare per-workflow promises
  const workflowPromises = workflows.map(async (wf) => {
    // Build dependency graph for this workflow
    const { deps, inDegree } = buildDependencyGraph(wf, edges);
    const { order, hasCycle } = topologicalSort(deps, inDegree);

    if (hasCycle) {
      // Mark all as failed in this workflow and reject to count partial failure
      for (const id of wf) opts?.onStatus?.(id, "failed");
      throw new Error("cycle");
    }

    // Execute nodes sequentially in this workflow
    for (let i = 0; i < order.length; i++) {
      const nodeId = order[i];

      // Dismiss initial toast when the first workflow starts its first node
      if (!firstStarted) {
        firstStarted = true;
        dismiss(toastId as any);
      }

      opts?.onStatus?.(nodeId, "running");
      try {
        await executeNodeHandler(nodeId);
        opts?.onStatus?.(nodeId, "done");
      } catch (e) {
        opts?.onStatus?.(nodeId, "failed");
        // Stop this workflow only
        break;
      }
    }
  });

  // Run workflows in parallel, allowing others to continue on failure
  const results = await Promise.allSettled(workflowPromises);
  const anyRejected = results.some((r) => r.status === "rejected");

  if (!firstStarted) {
    // If nothing started (e.g., only cycles), dismiss toast
    dismiss(toastId as any);
  }

  if (anyRejected) {
    error("Batch completed with some failures");
  } else {
    success("Batch completed successfully");
  }
}

async function executeNodeHandler(nodeId: string): Promise<void> {
  const node = useFlowStore.getState().nodes.find((n) => n.id === nodeId);
  if (!node) return;

  // Individual handlers now manage their own task tracking
  switch (node.type) {
    case "image-generator-node":
      await handleImageGenerate(nodeId);
      return;
    case "ai-image-editor-node":
      await handleAIImageEdit(nodeId);
      return;
    case "ai-image-upscaler-node":
      await handleUpscaleImage(nodeId);
      return;
    case "remove-background-node":
      await handleRemoveBackground(nodeId);
      return;
    case "face-swap-node":
      await handleFaceSwap(nodeId);
      return;
    case "video-generator-node":
      await handleGenerateVideo(nodeId);
      return;
    case "animation-node":
      await handleGenerateAnimation(nodeId);
      return;
    case "face-swap-video-node":
      await handleFaceSwapVideo(nodeId);
      return;
    case "lip-sync-node":
      await handleLipSync(nodeId);
      return;
    case "ai-voice-generator-node":
      await handleVoiceGenerate(nodeId);
      return;
    default:
      return;
  }
}
