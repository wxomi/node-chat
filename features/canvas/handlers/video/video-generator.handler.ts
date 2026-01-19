"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import {
  videoGeneratorConfigSchema,
  type VideoGeneratorNodeConfig,
} from "../../validations/video";
import {
  generateTextToVideo,
  generateImageToVideo,
  generateVideoToVideo,
  getVideoDetails,
} from "../../services/video";
import { type ImageDetails } from "../../lib/image";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useTaskManagerStore } from "../../stores/task-manager-store";

import { getConnectedAssetUrl } from "../../lib/canvas";
import {
  getOrientationFromSource,
  getDimensionsFromSource,
} from "../../lib/shared/orientation-propagation";

export async function handleGenerateVideo(nodeId: string) {
  const { showLoading, dismiss, success, error } = useOperationToasts();
  const { poll } = usePollOperation();
  const nodes = useFlowStore.getState().nodes;
  const node = nodes.find((n) => n.id === nodeId);
  const taskManager = useTaskManagerStore.getState();

  // Start tracking task
  taskManager.startNodeTask({
    nodeId,
    nodeType: node?.type,
    assetName: "Video",
  });

  const edges = useFlowStore.getState().edges;
  const { nodeConfigs, updateNodeConfig } = useConfigStore.getState();
  const nodeConfig = nodeConfigs?.[nodeId] as
    | VideoGeneratorNodeConfig
    | undefined;

  if (!nodeConfig) {
    taskManager.failNodeTask(nodeId);
    error("Node configuration not found");
    return;
  }

  const currentMode = nodeConfig.mode || "text-to-video";

  // Handle orientation inheritance based on mode
  let sourceOrientation: "square" | "landscape" | "portrait" | null = null;
  let currentOrientation: "square" | "landscape" | "portrait" = "square";
  let sourceDimensions: { width: number; height: number } | null = null;

  if (currentMode === "image-to-video") {
    // Get orientation from connected image source
    sourceOrientation = getOrientationFromSource(
      nodeId,
      "image-input",
      edges,
      nodeConfigs
    );
    // Get dimensions from connected image source
    sourceDimensions = getDimensionsFromSource(nodeId, "image-input", edges);
    if (sourceOrientation && sourceOrientation !== nodeConfig?.orientation) {
      updateNodeConfig(nodeId, {
        ...nodeConfig,
        orientation: sourceOrientation,
      });
    }
    currentOrientation =
      sourceOrientation || nodeConfig?.orientation || "square";
  } else if (currentMode === "video-to-video") {
    // Get orientation from connected video source
    sourceOrientation = getOrientationFromSource(
      nodeId,
      "video-input",
      edges,
      nodeConfigs
    );
    // Get dimensions from connected video source
    sourceDimensions = getDimensionsFromSource(nodeId, "video-input", edges);
    if (sourceOrientation && sourceOrientation !== nodeConfig?.orientation) {
      updateNodeConfig(nodeId, {
        ...nodeConfig,
        orientation: sourceOrientation,
      });
    }
    currentOrientation =
      sourceOrientation || nodeConfig?.orientation || "square";
  } else {
    // text-to-video: use config orientation (defaults to square)
    currentOrientation = nodeConfig?.orientation || "square";
    // text-to-video: no source dimensions
    sourceDimensions = null;
  }

  try {
    let dataToValidate: any = {
      mode: currentMode,
    };

    // Mode-specific input gathering and validation
    switch (currentMode) {
      case "text-to-video": {
        // Collect connected prompt from prompt-input
        const incomingPromptEdges = edges.filter(
          (edge) =>
            edge.target === nodeId && edge.targetHandle === "prompt-input"
        );

        let connectedPrompt = "";
        if (incomingPromptEdges.length > 0) {
          const edge = incomingPromptEdges[0];
          const sourceNode = nodes.find((node) => node.id === edge.source);
          connectedPrompt = (sourceNode?.data?.prompt as string) || "";
        }

        // Combine connected and typed prompts
        const prompts = [connectedPrompt, nodeConfig.prompt || ""].filter(
          (p) => p.trim() !== ""
        );
        const fullPrompt = prompts.join("\n");

        if (!fullPrompt || fullPrompt.trim() === "") {
          taskManager.failNodeTask(nodeId);
          error(
            "Please enter a prompt or connect a prompt node for text-to-video generation"
          );
          return;
        }

        dataToValidate = {
          mode: "text-to-video" as const,
          endSeconds: nodeConfig.endSeconds || 5,
          resolution: nodeConfig.resolution || "720p",
          orientation: currentOrientation,
          prompt: fullPrompt,
          name: nodeConfig.name,
        };
        break;
      }

      case "image-to-video": {
        const incomingImageEdges = edges.filter(
          (edge) =>
            edge.target === nodeId && edge.targetHandle === "image-input"
        );

        if (incomingImageEdges.length === 0) {
          taskManager.failNodeTask(nodeId);
          error("Please connect an image source for image-to-video generation");
          return;
        }

        if (incomingImageEdges.length > 1) {
          taskManager.failNodeTask(nodeId);
          error(
            "Video Generator only accepts one image. Please remove extra connections."
          );
          return;
        }

        const edge = incomingImageEdges[0];
        const sourceNode = nodes.find((node) => node.id === edge.source);

        if (!sourceNode) {
          taskManager.failNodeTask(nodeId);
          error("Connected node not found");
          return;
        }

        const imageUrl = (
          sourceNode?.data?.imageDetails as ImageDetails | undefined
        )?.downloads?.[0]?.url;

        if (!imageUrl) {
          taskManager.failNodeTask(nodeId);
          error(
            "Connected image has not finished generating yet. Please wait for the connected node to complete."
          );
          return;
        }

        // Get image asset using helper
        const imageAssetResult = getConnectedAssetUrl(sourceNode, {
          ...edge,
          sourceHandle: edge.sourceHandle ?? null,
        });
        if (!imageAssetResult) {
          taskManager.failNodeTask(nodeId);
          error(
            "Connected image has not finished generating yet. Please wait for the connected node to complete."
          );
          return;
        }

        console.log(
          "[handleGenerateVideo] Retrieved image asset for image-to-video",
          {
            sourceNodeId: edge.source,
            sourceNodeType: sourceNode.type,
            assetType: imageAssetResult.assetInfo?.type,
            fileName: imageAssetResult.assetInfo?.fileName,
          }
        );

        dataToValidate = {
          mode: "image-to-video" as const,
          endSeconds: nodeConfig.endSeconds || 5,
          resolution: nodeConfig.resolution || "720p",
          imageFilePath: imageUrl,
          name: nodeConfig.name,
        };
        break;
      }

      case "video-to-video": {
        const incomingVideoEdges = edges.filter(
          (edge) =>
            edge.target === nodeId && edge.targetHandle === "video-input"
        );

        if (incomingVideoEdges.length === 0) {
          taskManager.failNodeTask(nodeId);
          error("Please connect a video source for video-to-video generation");
          return;
        }

        if (incomingVideoEdges.length > 1) {
          taskManager.failNodeTask(nodeId);
          error(
            "Video Generator only accepts one video. Please remove extra connections."
          );
          return;
        }

        const edge = incomingVideoEdges[0];
        const sourceNode = nodes.find((node) => node.id === edge.source);

        if (!sourceNode) {
          taskManager.failNodeTask(nodeId);
          error("Connected node not found");
          return;
        }

        const videoUrl = (sourceNode?.data?.videoDetails as any)?.downloads?.[0]
          ?.url;

        if (!videoUrl) {
          taskManager.failNodeTask(nodeId);
          error(
            "Connected video has not finished generating yet. Please wait for the connected node to complete."
          );
          return;
        }

        // Get video asset using helper
        const videoAssetResult = getConnectedAssetUrl(sourceNode, {
          ...edge,
          sourceHandle: edge.sourceHandle ?? null,
        });
        if (!videoAssetResult) {
          taskManager.failNodeTask(nodeId);
          error(
            "Connected video has not finished generating yet. Please wait for the connected node to complete."
          );
          return;
        }

        console.log(
          "[handleGenerateVideo] Retrieved video asset for video-to-video",
          {
            sourceNodeId: edge.source,
            sourceNodeType: sourceNode.type,
            assetType: videoAssetResult.assetInfo?.type,
            fileName: videoAssetResult.assetInfo?.fileName,
          }
        );

        dataToValidate = {
          mode: "video-to-video" as const,
          startSeconds: nodeConfig.startSeconds || 0,
          endSeconds: nodeConfig.endSeconds || 5,
          fpsResolution: nodeConfig.fpsResolution || "HALF",
          style: {
            artStyle: nodeConfig.artStyle || "No Art Style",
            version: nodeConfig.version || "default",
            promptType: nodeConfig.promptType || "default",
            prompt: nodeConfig.prompt || null,
            model: nodeConfig.model || "default",
          },
          assets: {
            video_source: "file" as const,
            video_file_path: videoUrl,
          },
          name: nodeConfig.name,
        };
        break;
      }

      default:
        taskManager.failNodeTask(nodeId);
        error(`Unknown video generation mode: ${currentMode}`);
        return;
    }

    const result = videoGeneratorConfigSchema.safeParse(dataToValidate);

    if (!result.success) {
      taskManager.failNodeTask(nodeId);
      error("Validation failed. Please check your settings.");
      console.error("Validation errors:", result.error.flatten());
      return;
    }

    // Use node ID as toast ID to replace previous toasts for this node
    const nodeToastId = `node-${nodeId}`;
    let loadingToastId: string | number | null = null;

    try {
      // Dismiss any previous toast for this node
      dismiss(nodeToastId as any);

      loadingToastId = showLoading("Generating video...");

      let apiResult: {
        id: string;
        estimated_frame_cost: number;
        credits_charged: number;
      };

      // Call the appropriate service method based on mode
      switch (currentMode) {
        case "text-to-video":
          apiResult = await generateTextToVideo(
            result.data as Extract<
              (typeof result)["data"],
              { mode: "text-to-video" }
            >
          );
          break;
        case "image-to-video":
          apiResult = await generateImageToVideo(
            result.data as Extract<
              (typeof result)["data"],
              { mode: "image-to-video" }
            >
          );
          break;
        case "video-to-video":
          apiResult = await generateVideoToVideo(
            result.data as Extract<
              (typeof result)["data"],
              { mode: "video-to-video" }
            >
          );
          break;
        default:
          taskManager.failNodeTask(nodeId);
          error(`Unknown video generation mode: ${currentMode}`);
          return;
      }

      dismiss(loadingToastId);
      success("Video generation started!", { id: nodeToastId });

      // Store the orientation and dimensions that will be used for this generation
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
              "[handleGenerateVideo] Polling completed with error",
              {
                videoId: apiResult.id,
                status: data.status,
                error: data.error,
              }
            );
            error(
              `Video generation failed: ${
                data.error?.message || "Unknown error"
              }`,
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
              generatedSourceDimensions: undefined, // Clear stored dimensions on cancel
            });
            console.warn("[handleGenerateVideo] Polling canceled", {
              videoId: apiResult.id,
            });
            error("Video generation was canceled", { id: nodeToastId });
          },
          onComplete: (data: any) => {
            try {
              // Keep the generatedOrientation and generatedSourceDimensions when video completes
              const currentData = useFlowStore
                .getState()
                .nodes.find((n) => n.id === nodeId)?.data;
              useFlowStore.getState().updateNodeData(nodeId, {
                videoDetails: data,
                generatedOrientation:
                  currentData?.generatedOrientation || currentOrientation,
                generatedSourceDimensions:
                  currentData?.generatedSourceDimensions || sourceDimensions,
              });
              success("Video generation completed!", { id: nodeToastId });
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
      error("Failed to generate video. Please try again.", { id: nodeToastId });
      console.error("Generation error:", err);
    }
  } catch (err) {
    taskManager.failNodeTask(nodeId);
    error("An unexpected error occurred. Please try again.");
    console.error("Unexpected error:", err);
  }
}
