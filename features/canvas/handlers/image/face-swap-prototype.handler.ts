"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import { faceSwapConfigSchema } from "../../validations/image";
import { FaceMapping } from "../../validations/shared";
import { faceSwap, getImageDetails } from "../../services/image";
import { type ImageDetails } from "../../lib/image";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useApiCall } from "../../hooks/use-api-call";
import { useTaskManagerStore } from "../../stores/task-manager-store";

import { getConnectedAssetUrl } from "../../lib/canvas";
import { getOrientationFromSource } from "../../lib/shared/orientation-propagation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.magichour.ai";

export async function handleFaceSwapPrototype(nodeId: string) {
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
    assetName: "Face Swap",
  });

  const edges = useFlowStore.getState().edges;
  const { nodeConfigs, updateNodeConfig } = useConfigStore.getState();
  const nodeConfig = nodeConfigs?.[nodeId];

  // Update orientation from target-face-input source when generation starts
  // Face swap uses target image orientation (target determines output orientation)
  const sourceOrientation = getOrientationFromSource(
    nodeId,
    "target-face-input",
    edges,
    nodeConfigs
  );

  if (sourceOrientation && sourceOrientation !== nodeConfig?.orientation) {
    updateNodeConfig(nodeId, {
      ...(nodeConfig || {}),
      orientation: sourceOrientation,
    });
  }

  const incomingEdges = edges.filter((edge) => edge.target === nodeId);

  // Get source face (image)
  const sourceEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "source-face-input"
  );

  if (sourceEdges.length > 1) {
    taskManager.failNodeTask(nodeId);
    error(
      "Face Swap only accepts one source face image. Please remove extra connections."
    );
    return;
  }

  let sourceFilePath = "";
  if (sourceEdges.length > 0) {
    const edge = sourceEdges[0];
    const sourceNode = nodes.find((node) => node.id === edge.source);

    if (!sourceNode) {
      taskManager.failNodeTask(nodeId);
      error("Source face node not found");
      return;
    }

    const imageUrl = (
      sourceNode?.data?.imageDetails as ImageDetails | undefined
    )?.downloads?.[0]?.url;

    if (!imageUrl) {
      taskManager.failNodeTask(nodeId);
      error(
        "Source face image has not finished generating yet. Please wait for the connected node to complete."
      );
      return;
    }

    sourceFilePath = imageUrl;

    // Get source face image using helper
    const sourceAssetResult = getConnectedAssetUrl(sourceNode, {
      ...edge,
      sourceHandle: edge.sourceHandle ?? null,
    });
    if (!sourceAssetResult) {
      taskManager.failNodeTask(nodeId);
      error(
        "Source face image has not finished generating yet. Please wait for the connected node to complete."
      );
      return;
    }

    sourceFilePath = sourceAssetResult.url;
  } else {
    taskManager.failNodeTask(nodeId);
    error("Please connect a source face image");
    return;
  }

  // Get target face (image)
  const targetEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "target-face-input"
  );

  if (targetEdges.length > 1) {
    taskManager.failNodeTask(nodeId);
    error(
      "Face Swap only accepts one target face image. Please remove extra connections."
    );
    return;
  }

  let targetFilePath = "";
  if (targetEdges.length > 0) {
    const edge = targetEdges[0];
    const targetNode = nodes.find((node) => node.id === edge.source);

    if (!targetNode) {
      taskManager.failNodeTask(nodeId);
      error("Target face node not found");
      return;
    }

    const imageUrl = (
      targetNode?.data?.imageDetails as ImageDetails | undefined
    )?.downloads?.[0]?.url;

    if (!imageUrl) {
      taskManager.failNodeTask(nodeId);
      error(
        "Target face image has not finished generating yet. Please wait for the connected node to complete."
      );
      return;
    }

    targetFilePath = imageUrl;

    // Get target face image using helper
    const targetAssetResult = getConnectedAssetUrl(targetNode, {
      ...edge,
      sourceHandle: edge.sourceHandle ?? null,
    });
    if (!targetAssetResult) {
      taskManager.failNodeTask(nodeId);
      error(
        "Target face image has not finished generating yet. Please wait for the connected node to complete."
      );
      return;
    }

    targetFilePath = targetAssetResult.url;
  } else {
    taskManager.failNodeTask(nodeId);
    error("Please connect a target face image");
    return;
  }

  // Use embedded faceSwapMode from nodeConfig (defaults to "all-faces" if not set)
  const faceSwapMode = nodeConfig?.faceSwapMode || "all-faces";
  let faceMappings: FaceMapping[] = [];

  if (faceSwapMode === "individual-faces") {
    let detectionToastId: string | number | null = null;

    try {
      detectionToastId = showLoading("Detecting faces in target image...");

      const targetNode = nodes.find(
        (node) => node.id === targetEdges[0].source
      );
      const targetImageId = targetNode?.data?.generatedImageId;

      if (!targetImageId) {
        dismiss(detectionToastId);
        taskManager.failNodeTask(nodeId);
        error(
          "Individual faces mode requires automatic face detection. To use this mode, the target image must be generated by Magic Hour (it needs an image ID). " +
            "Either: (1) Use 'All faces' mode for uploaded images, or (2) Connect a generated image as the target."
        );
        return;
      }

      const detectionData = await poll({
        fetchData: async () => {
          return executeApiCall({
            endpoint: `${API_BASE_URL}/v1/face-detection/${targetImageId}`,
            method: "GET",
          });
        },
        isComplete: (data: any) => data.status === "complete",
        maxAttempts: 30,
      });

      dismiss(detectionToastId);

      if (!detectionData.faces || detectionData.faces.length === 0) {
        taskManager.failNodeTask(nodeId);
        error("No faces detected in target image");
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

  const dataToValidate = {
    faceSwapMode: faceSwapMode,
    sourceFilePath: sourceFilePath,
    targetFilePath: targetFilePath,
    faceMappings: faceMappings,
    assets: {
      imageSource: nodeConfig?.assets?.imageSource || "file",
      youtubeUrl: nodeConfig?.assets?.youtubeUrl,
    },
  };

  const result = faceSwapConfigSchema.safeParse(dataToValidate);

  if (result.success) {
    // Use node ID as toast ID to replace previous toasts for this node
    const nodeToastId = `node-${nodeId}`;
    let loadingToastId: string | number | null = null;

    try {
      // Dismiss any previous toast for this node
      dismiss(nodeToastId as any);

      loadingToastId = showLoading("Swapping faces...");

      const apiResult = await faceSwap(result.data);
      dismiss(loadingToastId);
      success("Face swap started!", { id: nodeToastId });

      // Store the orientation that will be used for this generation
      // Face swap uses target image orientation (target determines output orientation)
      const currentOrientation =
        sourceOrientation || nodeConfig?.orientation || "square";

      useFlowStore.getState().updateNodeData(nodeId, {
        generatedImageId: apiResult,
        imageDetails: undefined,
        generatedOrientation: currentOrientation, // Store orientation used for this generation
      });

      try {
        await poll({
          fetchData: () => getImageDetails(apiResult),
          isComplete: (data: any) =>
            data.status === "complete" ||
            data.status === "error" ||
            data.status === "canceled",
          onError: (data: any) => {
            taskManager.failNodeTask(nodeId);
            useFlowStore.getState().updateNodeData(nodeId, {
              generatedImageId: undefined,
              imageDetails: undefined,
              generatedOrientation: undefined, // Clear stored orientation on error
            });
            console.error(
              "[handleFaceSwapPrototype] Polling completed with error",
              {
                imageId: apiResult,
                status: data.status,
                error: data.error,
              }
            );
            error(
              `Face swap failed: ${data.error?.message || "Unknown error"}`,
              { id: nodeToastId }
            );
          },
          onCanceled: () => {
            taskManager.failNodeTask(nodeId);
            useFlowStore.getState().updateNodeData(nodeId, {
              generatedImageId: undefined,
              imageDetails: undefined,
              generatedOrientation: undefined, // Clear stored orientation on cancel
            });
            console.warn("[handleFaceSwapPrototype] Polling canceled", {
              imageId: apiResult,
            });
            error("Face swap was canceled", { id: nodeToastId });
          },
          onComplete: (data: any) => {
            try {
              // Keep the generatedOrientation when image completes
              const currentData = useFlowStore
                .getState()
                .nodes.find((n) => n.id === nodeId)?.data;
              useFlowStore.getState().updateNodeData(nodeId, {
                imageDetails: data,
                generatedOrientation:
                  currentData?.generatedOrientation ||
                  sourceOrientation ||
                  nodeConfig?.orientation ||
                  "square",
              });
              success("Face swap completed!", { id: nodeToastId });
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
        error("Error while checking image status. Please refresh.", {
          id: nodeToastId,
        });
      }
    } catch (err) {
      if (loadingToastId) dismiss(loadingToastId);
      taskManager.failNodeTask(nodeId);
      console.error("[handleFaceSwapPrototype] Face swap API call failed", {
        error: err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
        nodeId,
        requestConfig: result.data,
      });
      error("Failed to swap faces. Please try again.", { id: nodeToastId });
    }
  } else {
    taskManager.failNodeTask(nodeId);
    error(
      "Please check your configuration. All faces require source and target images."
    );
  }
}
