"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import {
  faceSwapVideoConfigSchema,
  type FaceSwapVideoNodeConfig,
} from "../../validations/video";
import { type FaceMapping } from "../../validations/shared";
import { generateFaceSwapVideo, getVideoDetails } from "../../services/video";
import { type ImageDetails } from "../../lib/image";
import { type VideoDetails } from "../../lib/video";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useApiCall } from "../../hooks/use-api-call";
import { useTaskManagerStore } from "../../stores/task-manager-store";

import { getConnectedAssetUrl } from "../../lib/canvas";
import { getOrientationFromSource } from "../../lib/shared/orientation-propagation";
import { validateYouTubeUrl } from "../../validations/shared/youtube-url.validation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.magichour.ai";

export async function handleFaceSwapVideo(nodeId: string) {
  const { showLoading, dismiss, success, error } = useOperationToasts();
  const { poll } = usePollOperation();
  const { executeApiCall } = useApiCall();
  const nodes = useFlowStore.getState().nodes;
  const node = nodes.find((n) => n.id === nodeId);
  const taskManager = useTaskManagerStore.getState();

  // Start tracking task
  taskManager.startNodeTask({
    nodeId,
    nodeType: node?.type,
    assetName: "Face Swap Video",
  });

  const edges = useFlowStore.getState().edges;
  const { nodeConfigs, updateNodeConfig } = useConfigStore.getState();
  const nodeConfig = nodeConfigs?.[nodeId] as
    | FaceSwapVideoNodeConfig
    | undefined;

  if (!nodeConfig) {
    taskManager.failNodeTask(nodeId);
    error("Node configuration not found");
    return;
  }

  // Update orientation from source when generation starts
  // Face swap video uses video-input for orientation (target video determines output orientation)
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

  // Get source face (image)
  const sourceEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "source-face-input"
  );

  if (sourceEdges.length > 1) {
    taskManager.failNodeTask(nodeId);
    error(
      "Face Swap Video only accepts one source face. Please remove extra connections."
    );
    return;
  }

  let sourceFilePath = "";
  if (sourceEdges.length > 0) {
    const sourceNode = nodes.find((n) => n.id === sourceEdges[0].source);

    if (!sourceNode) {
      taskManager.failNodeTask(nodeId);
      error("Source face node not found");
      return;
    }

    // Get source face image using helper (works for both uploaded and generated images)
    const sourceAssetResult = getConnectedAssetUrl(sourceNode, {
      ...sourceEdges[0],
      sourceHandle: sourceEdges[0].sourceHandle ?? null,
    });
    if (!sourceAssetResult) {
      taskManager.failNodeTask(nodeId);
      error(
        "Source face image has not finished loading. Please ensure the image is uploaded or generated."
      );
      return;
    }

    sourceFilePath = sourceAssetResult.url;
  } else {
    taskManager.failNodeTask(nodeId);
    error("Please connect a source face image");
    return;
  }

  // Get video input
  const videoEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "video-input"
  );

  if (videoEdges.length > 1) {
    taskManager.failNodeTask(nodeId);
    error(
      "Face Swap Video only accepts one video. Please remove extra connections."
    );
    return;
  }

  let videoFilePath = "";
  if (videoSource === "file") {
    if (videoEdges.length === 0) {
      taskManager.failNodeTask(nodeId);
      error("Please connect a video source or switch to YouTube mode");
      return;
    }

    const videoNode = nodes.find((n) => n.id === videoEdges[0].source);

    if (!videoNode) {
      taskManager.failNodeTask(nodeId);
      error("Video node not found");
      return;
    }

    // Get video asset using helper (works for both uploaded and generated videos)
    const videoAssetResult = getConnectedAssetUrl(videoNode, {
      ...videoEdges[0],
      sourceHandle: videoEdges[0].sourceHandle ?? null,
    });
    if (!videoAssetResult) {
      taskManager.failNodeTask(nodeId);
      error(
        "Connected video has not finished loading. Please ensure the video is uploaded or generated."
      );
      return;
    }

    videoFilePath = videoAssetResult.url;
  } else {
    // YouTube mode - use youtubeUrl from config
    const youtubeUrl = nodeConfig.assets.youtubeUrl;

    if (!youtubeUrl?.trim()) {
      taskManager.failNodeTask(nodeId);
      error("Please provide a YouTube URL or switch to file mode");
      return;
    }

    videoFilePath = youtubeUrl;
  }

  // Handle individual-faces mode with face detection
  const faceSwapMode = nodeConfig.assets.faceSwapMode || "all-faces";
  let faceMappings: FaceMapping[] = [];

  if (faceSwapMode === "individual-faces") {
    let detectionToastId: string | number | null = null;

    try {
      detectionToastId = showLoading("Detecting faces in video...");

      // Get the video ID from the connected video node
      const videoNode = nodes.find((n) => n.id === videoEdges[0].source);
      const videoId = videoNode?.data?.generatedVideoId;

      if (!videoId) {
        dismiss(detectionToastId);
        taskManager.failNodeTask(nodeId);
        error("Could not get video ID for face detection");
        return;
      }

      const detectionData = await poll({
        fetchData: async () => {
          return executeApiCall({
            endpoint: `${API_BASE_URL}/v1/face-detection/${videoId}`,
            method: "GET",
          });
        },
        isComplete: (data: any) => data.status === "complete",
        maxAttempts: 30,
      });

      dismiss(detectionToastId);

      if (!detectionData.faces || detectionData.faces.length === 0) {
        taskManager.failNodeTask(nodeId);
        error("No faces detected in video");
        return;
      }

      faceMappings = detectionData.faces.map((face: { path: string }) => ({
        original_face: face.path,
        new_face: sourceFilePath,
      }));
    } catch (detectionError) {
      if (detectionToastId) dismiss(detectionToastId);
      taskManager.failNodeTask(nodeId);
      error("Error detecting faces. Please try again.");
      return;
    }
  }

  // Build validation payload
  const dataToValidate = {
    name: nodeConfig.name,
    startSeconds: nodeConfig.startSeconds ?? 0,
    endSeconds: nodeConfig.endSeconds ?? 15,
    style: {
      version: nodeConfig.style?.version ?? "default",
    },
    assets: {
      faceSwapMode: faceSwapMode,
      imageFilePath: faceSwapMode === "all-faces" ? sourceFilePath : undefined,
      faceMappings:
        faceSwapMode === "individual-faces" ? faceMappings : undefined,
      videoSource: nodeConfig.assets.videoSource,
      videoFilePath:
        nodeConfig.assets.videoSource === "file" ? videoFilePath : undefined,
      youtubeUrl:
        nodeConfig.assets.videoSource === "youtube"
          ? nodeConfig.assets.youtubeUrl
          : undefined,
    },
  };

  const result = faceSwapVideoConfigSchema.safeParse(dataToValidate);

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

    loadingToastId = showLoading("Generating face swap video...");
    const apiResult = await generateFaceSwapVideo(result.data);
    dismiss(loadingToastId);
    success("Face swap video started!", { id: nodeToastId });

    console.log(
      "[handleFaceSwapVideo] Video generation API call completed successfully",
      {
        generatedVideoId: apiResult.id,
        creditsCharged: apiResult.credits_charged,
        estimatedFrameCost: apiResult.estimated_frame_cost,
        requestConfig: result.data,
      }
    );

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
          console.error("[handleFaceSwapVideo] Polling completed with error", {
            videoId: apiResult.id,
            status: data.status,
            error: data.error,
          });
          error(
            `Face swap video failed: ${data.error?.message || "Unknown error"}`,
            { id: nodeToastId }
          );
        },
        onCanceled: () => {
          taskManager.failNodeTask(nodeId);
          useFlowStore.getState().updateNodeData(nodeId, {
            generatedVideoId: undefined,
            videoDetails: undefined,
            creditsCharged: undefined,
            generatedOrientation: undefined, // Clear stored orientation on cancel
          });
          console.warn("[handleFaceSwapVideo] Polling canceled", {
            videoId: apiResult.id,
          });
          error("Face swap video was canceled", { id: nodeToastId });
        },
        onComplete: (data: any) => {
          try {
            console.log("[handleFaceSwapVideo] Polling completed", {
              videoId: apiResult.id,
              status: data.status,
              error: data.error,
            });
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
            success("Face swap video completed!", { id: nodeToastId });
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
      console.error("[handleFaceSwapVideo] Polling error", {
        pollError,
        videoId: apiResult.id,
      });
      error("Error while checking video status. Please refresh.", {
        id: nodeToastId,
      });
    }
  } catch (err) {
    if (loadingToastId) dismiss(loadingToastId);
    taskManager.failNodeTask(nodeId);
    console.error("[handleFaceSwapVideo] Video generation API call failed", {
      error: err,
      errorMessage: err instanceof Error ? err.message : String(err),
      errorStack: err instanceof Error ? err.stack : undefined,
      nodeId,
      requestConfig: result.data,
    });
    error("Failed to generate face swap video. Please try again.", {
      id: nodeToastId,
    });
  }
}
