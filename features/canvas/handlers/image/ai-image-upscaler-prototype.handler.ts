"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import { aiImageUpscalerConfigSchema } from "../../validations/image";
import { upscaleImage, getImageDetails } from "../../services/image";
import { type ImageDetails } from "../../lib/image";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useTaskManagerStore } from "../../stores/task-manager-store";

import { getConnectedAssetUrl } from "../../lib/canvas";
import { getOrientationFromSource } from "../../lib/shared/orientation-propagation";

export async function handleUpscaleImagePrototype(nodeId: string) {
  const { showLoading, dismiss, success, error } = useOperationToasts();
  const { poll } = usePollOperation();
  const nodes = useFlowStore.getState().nodes;
  const node = nodes.find((n) => n.id === nodeId);
  const taskManager = useTaskManagerStore.getState();

  // Start tracking task
  taskManager.startNodeTask({
    nodeId,
    nodeType: node?.type,
    assetName: "Image Upscale",
  });

  const edges = useFlowStore.getState().edges;
  const { nodeConfigs, updateNodeConfig } = useConfigStore.getState();
  const nodeConfig = nodeConfigs?.[nodeId];

  // Update orientation from source when generation starts
  const sourceOrientation = getOrientationFromSource(
    nodeId,
    "image-input",
    edges,
    nodeConfigs
  );

  if (sourceOrientation && sourceOrientation !== nodeConfig?.orientation) {
    updateNodeConfig(nodeId, {
      ...(nodeConfig || {}),
      orientation: sourceOrientation,
    });
  }

  const incomingEdges = edges.filter(
    (edge) => edge.target === nodeId && edge.targetHandle === "image-input"
  );

  if (incomingEdges.length > 1) {
    taskManager.failNodeTask(nodeId);
    error(
      "AI Image Upscaler only accepts one image. Please remove extra connections."
    );
    return;
  }

  let imageFilePath = "";

  if (incomingEdges.length > 0) {
    const edge = incomingEdges[0];
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

    imageFilePath = imageUrl;

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

    imageFilePath = imageAssetResult.url;
  } else {
    taskManager.failNodeTask(nodeId);
    error("Please connect an image source");
    return;
  }

  // Use embedded scale factor from nodeConfig (default to "2")
  const dataToValidate = {
    scaleFactor: nodeConfig?.scaleFactor || "2",
    enhancement: nodeConfig?.enhancement || "Balanced",
    prompt: nodeConfig?.prompt || "",
    imageFilePath: imageFilePath,
  };

  const result = aiImageUpscalerConfigSchema.safeParse(dataToValidate);

  if (result.success) {
    // Use node ID as toast ID to replace previous toasts for this node
    const nodeToastId = `node-${nodeId}`;
    let loadingToastId: string | number | null = null;

    try {
      // Dismiss any previous toast for this node
      dismiss(nodeToastId as any);

      loadingToastId = showLoading("Upscaling image...");

      const apiResult = await upscaleImage(result.data);
      dismiss(loadingToastId);
      success("Image upscaling started!", { id: nodeToastId });

      // Store the orientation that will be used for this generation
      const currentOrientation =
        sourceOrientation || nodeConfig?.orientation || "square";

      useFlowStore.getState().updateNodeData(nodeId, {
        generatedImageId: apiResult.id,
        creditsCharged: apiResult.credits_charged,
        imageDetails: undefined,
        generatedOrientation: currentOrientation, // Store orientation used for this generation
      });

      try {
        await poll({
          fetchData: () => getImageDetails(apiResult.id),
          isComplete: (data: any) =>
            data.status === "complete" ||
            data.status === "error" ||
            data.status === "canceled",
          onError: (data: any) => {
            taskManager.failNodeTask(nodeId);
            useFlowStore.getState().updateNodeData(nodeId, {
              generatedImageId: undefined,
              imageDetails: undefined,
              creditsCharged: undefined,
              generatedOrientation: undefined, // Clear stored orientation on error
            });
            console.error("[handleUpscaleImagePrototype] Polling completed with error", {
              imageId: apiResult.id,
              status: data.status,
              error: data.error,
            });
            error(
              `Image upscaling failed: ${
                data.error?.message || "Unknown error"
              }`,
              { id: nodeToastId }
            );
          },
          onCanceled: () => {
            taskManager.failNodeTask(nodeId);
            useFlowStore.getState().updateNodeData(nodeId, {
              generatedImageId: undefined,
              imageDetails: undefined,
              creditsCharged: undefined,
              generatedOrientation: undefined, // Clear stored orientation on cancel
            });
            console.warn("[handleUpscaleImagePrototype] Polling canceled", {
              imageId: apiResult.id,
            });
            error("Image upscaling was canceled", { id: nodeToastId });
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
              success("Image upscaling completed!", { id: nodeToastId });
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
      error("Failed to upscale image. Please try again.", { id: nodeToastId });
    }
  } else {
    taskManager.failNodeTask(nodeId);
    error("Please check your settings and connect an image");
  }
}

