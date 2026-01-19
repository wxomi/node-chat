"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import {
  lipSyncConfigSchema,
  type LipSyncNodeConfig,
} from "../../validations/video";
import { generateLipSync, getVideoDetails } from "../../services/video";
import { type VideoDetails } from "../../lib/video";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useTaskManagerStore } from "../../stores/task-manager-store";

import { getConnectedAssetUrl } from "../../lib/canvas";
import { getOrientationFromSource } from "../../lib/shared/orientation-propagation";
import { validateYouTubeUrl } from "../../validations/shared/youtube-url.validation";

export async function handleLipSync(nodeId: string) {
  const { showLoading, dismiss, success, error } = useOperationToasts();
  const { poll } = usePollOperation();
  const nodes = useFlowStore.getState().nodes;
  const node = nodes.find((n) => n.id === nodeId);
  const taskManager = useTaskManagerStore.getState();

  // Start tracking task
  taskManager.startNodeTask({
    nodeId,
    nodeType: node?.type,
    assetName: "Lip Sync",
  });

  const edges = useFlowStore.getState().edges;
  const { nodeConfigs, updateNodeConfig } = useConfigStore.getState();
  const nodeConfig = nodeConfigs?.[nodeId] as LipSyncNodeConfig | undefined;

  if (!nodeConfig) {
    taskManager.failNodeTask(nodeId);
    error("Node configuration not found");
    return;
  }

  // Update orientation from source when generation starts
  // Lip sync uses video-input for orientation (video determines output orientation)
  const sourceOrientation = getOrientationFromSource(
    nodeId,
    "video-input",
    edges,
    nodeConfigs
  );

  if (sourceOrientation && sourceOrientation !== nodeConfig?.orientation) {
    updateNodeConfig(nodeId, {
      ...nodeConfig,
      orientation: sourceOrientation,
    });
  }

  // Get the current orientation (may have been updated from source)
  let currentOrientation =
    sourceOrientation || nodeConfig?.orientation || "square";

  // Handle YouTube video orientation detection
  const videoSource = nodeConfig.assets?.videoSource || "file";
  if (videoSource === "youtube") {
    const youtubeUrl = nodeConfig.assets?.youtubeUrl;
    if (youtubeUrl?.trim()) {
      const validation = validateYouTubeUrl(youtubeUrl);
      if (validation.isValid) {
        const youtubeOrientation = validation.isShorts
          ? "portrait"
          : "landscape";

        // Update orientation if different from current config
        if (youtubeOrientation !== nodeConfig?.orientation) {
          updateNodeConfig(nodeId, {
            ...nodeConfig,
            orientation: youtubeOrientation,
          });
        }

        // Use YouTube orientation for generation (overrides connected source orientation)
        currentOrientation = youtubeOrientation;
      }
    }
  }

  const incomingEdges = edges.filter((edge) => edge.target === nodeId);

  // Get audio input (required)
  const audioEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "audio-input"
  );

  if (audioEdges.length > 1) {
    taskManager.failNodeTask(nodeId);
    error(
      "Lip Sync only accepts one audio input. Please remove extra connections."
    );
    return;
  }

  if (audioEdges.length === 0) {
    taskManager.failNodeTask(nodeId);
    error("Please connect an audio source");
    return;
  }

  const audioEdge = audioEdges[0];
  const audioNode = nodes.find((node) => node.id === audioEdge.source);

  if (!audioNode) {
    taskManager.failNodeTask(nodeId);
    error("Connected audio node not found");
    return;
  }

  // Try to get audio URL from various possible data structures
  const audioAssetResult = getConnectedAssetUrl(audioNode, {
    ...audioEdge,
    sourceHandle: audioEdge.sourceHandle ?? null,
  });
  if (!audioAssetResult) {
    taskManager.failNodeTask(nodeId);
    error(
      "Connected audio has not finished uploading yet. Please wait for the connected node to complete."
    );
    return;
  }

  const audioUrl = audioAssetResult.url;

  console.log("[handleLipSync] Retrieved audio asset", {
    audioNodeId: audioEdge.source,
    audioNodeType: audioNode.type,
    assetType: audioAssetResult.assetInfo?.type,
    fileName: audioAssetResult.assetInfo?.fileName,
  });

  // Get video input (conditional on videoSource)
  const videoEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "video-input"
  );

  if (videoEdges.length > 1) {
    taskManager.failNodeTask(nodeId);
    error(
      "Lip Sync only accepts one video input. Please remove extra connections."
    );
    return;
  }

  let videoFilePath: string | undefined = undefined;
  // videoSource declared above for YouTube orientation detection

  if (videoSource === "file") {
    if (videoEdges.length === 0) {
      taskManager.failNodeTask(nodeId);
      error("Please connect a video source or switch to YouTube mode");
      return;
    }

    const videoEdge = videoEdges[0];
    const videoNode = nodes.find((node) => node.id === videoEdge.source);

    if (!videoNode) {
      taskManager.failNodeTask(nodeId);
      error("Connected video node not found");
      return;
    }

    const videoUrl = (videoNode?.data?.videoDetails as VideoDetails | undefined)
      ?.downloads?.[0]?.url;

    if (!videoUrl) {
      taskManager.failNodeTask(nodeId);
      error(
        "Connected video has not finished generating yet. Please wait for the connected node to complete."
      );
      return;
    }
    videoFilePath = videoUrl;

    // Get video asset using helper
    const videoAssetResult = getConnectedAssetUrl(videoNode, {
      ...videoEdge,
      sourceHandle: videoEdge.sourceHandle ?? null,
    });
    if (!videoAssetResult) {
      taskManager.failNodeTask(nodeId);
      error(
        "Connected video has not finished generating yet. Please wait for the connected node to complete."
      );
      return;
    }

    videoFilePath = videoAssetResult.url;

    console.log("[handleLipSync] Retrieved video asset", {
      videoNodeId: videoEdge.source,
      videoNodeType: videoNode.type,
      assetType: videoAssetResult.assetInfo?.type,
      fileName: videoAssetResult.assetInfo?.fileName,
    });
  } else if (videoSource === "youtube") {
    if (!nodeConfig.assets?.youtubeUrl?.trim()) {
      taskManager.failNodeTask(nodeId);
      error("Please provide a YouTube URL or switch to file mode");
      return;
    }
    if (!nodeConfig.assets.youtubeUrl.toLowerCase().includes("youtube")) {
      taskManager.failNodeTask(nodeId);
      error("Please enter a valid YouTube URL (must contain 'youtube')");
      return;
    }
  }

  // Build validation payload
  const dataToValidate = {
    name: nodeConfig.name,
    startSeconds: nodeConfig.startSeconds ?? 0,
    endSeconds: nodeConfig.endSeconds ?? 15,
    maxFpsLimit: nodeConfig.maxFpsLimit ?? 12,
    style: {
      generationMode: nodeConfig.style?.generationMode ?? "lite",
    },
    assets: {
      audioFilePath: audioUrl,
      videoSource: videoSource,
      videoFilePath: videoFilePath,
      youtubeUrl: nodeConfig.assets?.youtubeUrl,
    },
  };

  const result = lipSyncConfigSchema.safeParse(dataToValidate);

  if (!result.success) {
    taskManager.failNodeTask(nodeId);
    const flattened = result.error.flatten();
    const errorMessage =
      flattened.formErrors?.[0] ||
      Object.values(flattened.fieldErrors)?.[0]?.[0] ||
      "Validation failed. Please check your settings.";
    error(errorMessage);
    return;
  }

  // Use node ID as toast ID to replace previous toasts for this node
  const nodeToastId = `node-${nodeId}`;
  let loadingToastId: string | number | null = null;
  try {
    // Dismiss any previous toast for this node
    dismiss(nodeToastId as any);

    loadingToastId = showLoading("Generating lip sync video...");
    const apiResult = await generateLipSync(result.data);
    dismiss(loadingToastId);
    success("Lip sync video generation started!", { id: nodeToastId });

    useFlowStore.getState().updateNodeData(nodeId, {
      generatedVideoId: apiResult.id,
      creditsCharged: apiResult.credits_charged,
      videoDetails: undefined,
      generatedOrientation: currentOrientation, // Store orientation used for this generation
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
          });
          console.error("[handleLipSync] Polling completed with error", {
            videoId: apiResult.id,
            status: data.status,
            error: data.error,
          });
          error(`Lip sync failed: ${data.error?.message || "Unknown error"}`, {
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
          });
          console.warn("[handleLipSync] Polling canceled", {
            videoId: apiResult.id,
          });
          error("Lip sync was canceled", { id: nodeToastId });
        },
        onComplete: (data: any) => {
          try {
            // Keep the generatedOrientation when video completes
            const currentData = useFlowStore
              .getState()
              .nodes.find((n) => n.id === nodeId)?.data;
            useFlowStore.getState().updateNodeData(nodeId, {
              videoDetails: data,
              generatedOrientation:
                currentData?.generatedOrientation ||
                nodeConfig?.orientation ||
                "square",
            });
            success("Lip sync video generation completed!", {
              id: nodeToastId,
            });
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
    error("Failed to generate lip sync video. Please try again.", {
      id: nodeToastId,
    });
  }
}
