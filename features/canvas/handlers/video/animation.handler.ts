"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import {
  animationConfigSchema,
  type AnimationNodeConfig,
} from "../../validations/video";
import { generateAnimation, getVideoDetails } from "../../services/video";
import { type ImageDetails } from "../../lib/image";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useTaskManagerStore } from "../../stores/task-manager-store";
import { getConnectedAssetUrl } from "../../lib/canvas";
import {
  getOrientationFromSource,
  getDimensionsFromSource,
} from "../../lib/shared/orientation-propagation";

export async function handleGenerateAnimation(nodeId: string) {
  const { showLoading, dismiss, success, error } = useOperationToasts();
  const { poll } = usePollOperation();
  const nodes = useFlowStore.getState().nodes;
  const node = nodes.find((n) => n.id === nodeId);
  const taskManager = useTaskManagerStore.getState();

  // Start tracking task
  taskManager.startNodeTask({
    nodeId,
    nodeType: node?.type,
    assetName: "Animation",
  });

  const edges = useFlowStore.getState().edges;
  const { nodeConfigs, updateNodeConfig } = useConfigStore.getState();
  const nodeConfig = nodeConfigs?.[nodeId] as
    | AnimationNodeConfig
    | undefined;

  if (!nodeConfig) {
    taskManager.failNodeTask(nodeId);
    error("Node configuration not found");
    return;
  }

  // Update orientation from image-input source when generation starts
  const sourceOrientation = getOrientationFromSource(
    nodeId,
    "image-input",
    edges,
    nodeConfigs
  );
  
  if (sourceOrientation && sourceOrientation !== nodeConfig?.orientation) {
    updateNodeConfig(nodeId, {
      ...nodeConfig,
      orientation: sourceOrientation,
    });
  }

  // Store the orientation that will be used for this generation
  const currentOrientation = sourceOrientation || nodeConfig?.orientation || "square";

  // Get dimensions from image-input source when generation starts
  const sourceDimensions = getDimensionsFromSource(nodeId, "image-input", edges);

  // Collect connected inputs
  const incomingEdges = edges.filter((edge) => edge.target === nodeId);

  // Image (optional)
  let imageFilePath: string | undefined = undefined;
  const imageEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "image-input"
  );
  if (imageEdges.length > 0) {
    const sourceNode = nodes.find((n) => n.id === imageEdges[0].source);
    const url = (sourceNode?.data?.imageDetails as ImageDetails | undefined)
      ?.downloads?.[0]?.url;
    if (url) imageFilePath = url;
  }

  // Audio (required when audioSource === file)
  let audioFilePath: string | undefined = undefined;
  const audioEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "audio-input"
  );

  if (nodeConfig.assets?.audioSource === "file") {
    if (audioEdges.length === 0) {
      taskManager.failNodeTask(nodeId);
      error("Please connect an audio source or switch audio mode");
      return;
    }
    const sourceNode = nodes.find((n) => n.id === audioEdges[0].source);
    // Try standard shape first (similar to image upload)
    const audioDetails = sourceNode?.data?.audioDetails as
      | { downloads?: Array<{ url?: string }> }
      | undefined;
    const candidate =
      audioDetails?.downloads?.[0]?.url ||
      (sourceNode?.data?.filePath as string | undefined);

    if (!candidate || typeof candidate !== "string") {
      taskManager.failNodeTask(nodeId);
      error(
        "Connected audio is not ready yet. Please wait for upload/processing to complete."
      );
      return;
    }
    audioFilePath = candidate;
  }

  console.log("[handleGenerateAnimation] Processing inputs", {
    nodeId,
    imageEdgesCount: imageEdges.length,
    audioEdgesCount: audioEdges.length,
    audioSource: nodeConfig.assets?.audioSource,
  });

  // Image (optional)
  if (imageEdges.length > 0) {
    const imageEdge = imageEdges[0];
    const sourceNode = nodes.find((n) => n.id === imageEdge.source);
    const assetResult = getConnectedAssetUrl(sourceNode, {
      ...imageEdge,
      sourceHandle: imageEdge.sourceHandle ?? null,
    });

    if (assetResult) {
      imageFilePath = assetResult.url;
      console.log("[handleGenerateAnimation] Retrieved image asset", {
        sourceNodeId: imageEdge.source,
        sourceNodeType: sourceNode?.type,
        assetType: assetResult.assetInfo?.type,
        fileName: assetResult.assetInfo?.fileName,
      });
    } else {
      console.warn("[handleGenerateAnimation] Failed to get image asset", {
        sourceNodeId: imageEdge.source,
        sourceNodeType: sourceNode?.type,
        sourceHandle: imageEdge.sourceHandle,
      });
    }
  }

  // Audio (required when audioSource === file)
  if (nodeConfig.assets?.audioSource === "file") {
    if (audioEdges.length === 0) {
      taskManager.failNodeTask(nodeId);
      error("Please connect an audio source or switch audio mode");
      return;
    }

    const audioEdge = audioEdges[0];
    const sourceNode = nodes.find((n) => n.id === audioEdge.source);
    const assetResult = getConnectedAssetUrl(sourceNode, {
      ...audioEdge,
      sourceHandle: audioEdge.sourceHandle ?? null,
    });

    if (assetResult) {
      audioFilePath = assetResult.url;
      console.log("[handleGenerateAnimation] Retrieved audio asset", {
        sourceNodeId: audioEdge.source,
        sourceNodeType: sourceNode?.type,
        assetType: assetResult.assetInfo?.type,
        fileName: assetResult.assetInfo?.fileName,
      });
    } else {
      taskManager.failNodeTask(nodeId);
      error(
        "Connected audio is not ready yet. Please wait for upload/processing to complete."
      );
      return;
    }
  }

  // Build payload for validation - inject fixed width/height
  const dataToValidate = {
    name: nodeConfig.name,
    fps: nodeConfig.fps ?? 12,
    endSeconds: nodeConfig.endSeconds ?? 15,
    width: 512 as const,
    height: 960 as const,
    style: {
      artStyle: nodeConfig.style?.artStyle ?? "Painterly Illustration",
      artStyleCustom: nodeConfig.style?.artStyleCustom,
      cameraEffect: nodeConfig.style?.cameraEffect ?? "Simple Zoom In",
      promptType: nodeConfig.style?.promptType ?? "custom",
      prompt: nodeConfig.style?.prompt || undefined,
      transitionSpeed: nodeConfig.style?.transitionSpeed ?? 5,
    },
    assets: {
      audioSource: nodeConfig.assets?.audioSource ?? "none",
      audioFilePath,
      youtubeUrl: nodeConfig.assets?.youtubeUrl,
      imageFilePath,
    },
  };

  console.log("[handleGenerateAnimation] Payload built", {
    imageFilePath,
    audioFilePath,
    audioSource: nodeConfig.assets?.audioSource,
  });

  const result = animationConfigSchema.safeParse(dataToValidate);

  if (!result.success) {
    // Get the first error message from Zod validation
    const flattened = result.error.flatten();
    const errorMessage =
      flattened.formErrors?.[0] ||
      Object.values(flattened.fieldErrors)?.[0]?.[0] ||
      "Validation failed. Please check your settings.";
    console.error("[handleGenerateAnimation] Validation failed", {
      nodeId,
      imageFilePath,
      audioFilePath,
      audioSource: nodeConfig.assets?.audioSource,
      flattened,
    });
    taskManager.failNodeTask(nodeId);
    error(errorMessage);
    return;
  }

  // Validate YouTube URL if audioSource is youtube
  if (result.data.assets.audioSource === "youtube") {
    if (!result.data.assets.youtubeUrl?.trim()) {
      taskManager.failNodeTask(nodeId);
      error(
        "Please provide a YouTube URL or switch to a different audio source mode"
      );
      return;
    }
    if (!result.data.assets.youtubeUrl.toLowerCase().includes("youtube")) {
      taskManager.failNodeTask(nodeId);
      error("Please enter a valid YouTube URL (must contain 'youtube')");
      return;
    }
  }

  // Use node ID as toast ID to replace previous toasts for this node
  const nodeToastId = `node-${nodeId}`;
  let loadingToastId: string | number | null = null;
  try {
    // Dismiss any previous toast for this node
    dismiss(nodeToastId as any);

    loadingToastId = showLoading("Generating animation...");
    const apiResult = await generateAnimation(result.data);
    dismiss(loadingToastId);
    success("Animation started!", { id: nodeToastId });

    useFlowStore.getState().updateNodeData(nodeId, {
      generatedVideoId: apiResult.id,
      creditsCharged: apiResult.credits_charged,
      videoDetails: undefined,
      generatedOrientation: currentOrientation, // Store orientation used for this generation
      generatedSourceDimensions: sourceDimensions, // Store source dimensions used for this generation
    });

    try {
      await poll({
        fetchData: () => getVideoDetails(apiResult.id),
        isComplete: (data: any) =>
          data.status === "complete" ||
          data.status === "error" ||
          data.status === "canceled",
        onError: (data: any) => {
          taskManager.failNodeTask(nodeId);
          useFlowStore.getState().updateNodeData(nodeId, {
            generatedVideoId: undefined,
            videoDetails: undefined,
            creditsCharged: undefined,
            generatedOrientation: undefined, // Clear stored orientation on error
            generatedSourceDimensions: undefined, // Clear stored dimensions on error
          });
          console.error(
            "[handleGenerateAnimation] Polling completed with error",
            {
              videoId: apiResult.id,
              status: data.status,
              error: data.error,
            }
          );
          error(`Animation failed: ${data.error?.message || "Unknown error"}`, {
            id: nodeToastId,
          });
        },
        onCanceled: () => {
          taskManager.failNodeTask(nodeId);
          useFlowStore.getState().updateNodeData(nodeId, {
            generatedVideoId: undefined,
            videoDetails: undefined,
            creditsCharged: undefined,
            generatedOrientation: undefined, // Clear stored orientation on cancel
            generatedSourceDimensions: undefined, // Clear stored dimensions on cancel
          });
          console.warn("[handleGenerateAnimation] Polling canceled", {
            videoId: apiResult.id,
          });
          error("Animation was canceled", { id: nodeToastId });
        },
        onComplete: (data: any) => {
          try {
            // Keep the generatedOrientation and generatedSourceDimensions when video completes
            const currentData = useFlowStore.getState().nodes.find((n) => n.id === nodeId)?.data;
            useFlowStore.getState().updateNodeData(nodeId, {
              videoDetails: data,
              generatedOrientation: currentData?.generatedOrientation || currentOrientation,
              generatedSourceDimensions: currentData?.generatedSourceDimensions || sourceDimensions,
            });
            success("Animation completed!", { id: nodeToastId });
          } catch (e) {
            console.error("[handler] Error in onComplete", e);
          } finally {
            taskManager.finishNodeTask(nodeId);
          }
        },
      });
    } catch (pollError) {
      if (loadingToastId) dismiss(loadingToastId);
      taskManager.failNodeTask(nodeId);
      error("Error while checking video status. Please refresh.", {
        id: nodeToastId,
      });
    }
  } catch (err) {
    if (loadingToastId) dismiss(loadingToastId);
    taskManager.failNodeTask(nodeId);
    error("Failed to generate animation. Please try again.", {
      id: nodeToastId,
    });
  }
}
