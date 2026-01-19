"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import {
  removeBackground,
  getImageDetails,
} from "../../services/image";
import { removeBackgroundConfigSchema } from "../../validations/image";
import { type ImageDetails } from "../../lib/image";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useTaskManagerStore } from "../../stores/task-manager-store";

import { getConnectedAssetUrl } from "../../lib/canvas";
import { getOrientationFromSource } from "../../lib/shared/orientation-propagation";

export async function handleRemoveBackground(nodeId: string) {
  const { showLoading, dismiss, success, error } = useOperationToasts();
  const { poll } = usePollOperation();
  const nodes = useFlowStore.getState().nodes;
  const node = nodes.find((n) => n.id === nodeId);
  const taskManager = useTaskManagerStore.getState();

  // Start tracking task
  taskManager.startNodeTask({
    nodeId,
    nodeType: node?.type,
    assetName: "Remove Background",
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
      ...nodeConfig,
      orientation: sourceOrientation,
    });
  }

  const incomingEdges = edges.filter(
    (edge) => edge.target === nodeId && edge.targetHandle === "image-input"
  );

  if (incomingEdges.length === 0) {
    taskManager.failNodeTask(nodeId);
    error("Please connect at least one image");
    return;
  }

  if (incomingEdges.length > 2) {
    taskManager.failNodeTask(nodeId);
    error(
      "Background Remover accepts a maximum of 2 images (main image + optional background). Please remove extra connections."
    );
    return;
  }

  const mainImageEdge = incomingEdges[0];
  const mainImageNode = nodes.find((node) => node.id === mainImageEdge.source);
  // Get main image asset using helper
  let imageFilePath: string | undefined;
  if (mainImageNode) {
    const imageAssetResult = getConnectedAssetUrl(mainImageNode, {
      ...mainImageEdge,
      sourceHandle: mainImageEdge.sourceHandle ?? null,
    });
    if (!imageAssetResult) {
      taskManager.failNodeTask(nodeId);
      error("Connected image has not finished generating yet. Please wait.");
      return;
    }

    imageFilePath = imageAssetResult.url;

    console.log("[handleRemoveBackground] Retrieved main image asset", {
      sourceNodeId: mainImageEdge.source,
      sourceNodeType: mainImageNode.type,
      assetType: imageAssetResult.assetInfo?.type,
      fileName: imageAssetResult.assetInfo?.fileName,
    });
  } else {
    taskManager.failNodeTask(nodeId);
    error("Connected image node not found");
    return;
  }

  let backgroundImageFilePath: string | undefined;
  if (incomingEdges.length > 1) {
    const backgroundImageEdge = incomingEdges[1];
    const backgroundImageNode = nodes.find(
      (node) => node.id === backgroundImageEdge.source
    );
    backgroundImageFilePath = (
      backgroundImageNode?.data?.imageDetails as ImageDetails | undefined
    )?.downloads?.[0]?.url;

    if (!backgroundImageFilePath) {
      taskManager.failNodeTask(nodeId);
      error(
        "Connected background image has not finished generating yet. Please wait."
      );
      return;
    }

    // Get background image asset using helper
    if (backgroundImageNode) {
      const bgImageAssetResult = getConnectedAssetUrl(backgroundImageNode, {
        ...backgroundImageEdge,
        sourceHandle: backgroundImageEdge.sourceHandle ?? null,
      });
      if (!bgImageAssetResult) {
        taskManager.failNodeTask(nodeId);
        error(
          "Connected background image has not finished generating yet. Please wait."
        );
        return;
      }

      backgroundImageFilePath = bgImageAssetResult.url;

      console.log("[handleRemoveBackground] Retrieved background image asset", {
        sourceNodeId: backgroundImageEdge.source,
        sourceNodeType: backgroundImageNode.type,
        assetType: bgImageAssetResult.assetInfo?.type,
        fileName: bgImageAssetResult.assetInfo?.fileName,
      });
    }
  }

  const dataToValidate = {
    imageFilePath: imageFilePath,
    ...(backgroundImageFilePath && { backgroundImageFilePath }),
  };

  const result = removeBackgroundConfigSchema.safeParse(dataToValidate);

  if (result.success) {
    // Use node ID as toast ID to replace previous toasts for this node
    const nodeToastId = `node-${nodeId}`;
    let loadingToastId: string | number | null = null;

    try {
      // Dismiss any previous toast for this node
      dismiss(nodeToastId as any);

      loadingToastId = showLoading("Removing background...");

      const apiResult = await removeBackground(result.data);
      dismiss(loadingToastId);
      success("Background removal started!", { id: nodeToastId });

      // Store the orientation that will be used for this generation
      const currentOrientation = sourceOrientation || nodeConfig?.orientation || "square";
      
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
            console.error(
              "[handleRemoveBackground] Polling completed with error",
              {
                imageId: apiResult.id,
                status: data.status,
                error: data.error,
              }
            );
            error(
              `Background removal failed: ${
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
            console.warn("[handleRemoveBackground] Polling canceled", {
              imageId: apiResult.id,
            });
            error("Background removal was canceled", { id: nodeToastId });
          },
          onComplete: (data: any) => {
            try {
              // Keep the generatedOrientation when image completes
              const currentData = useFlowStore.getState().nodes.find((n) => n.id === nodeId)?.data;
              useFlowStore.getState().updateNodeData(nodeId, {
                imageDetails: data,
                generatedOrientation: currentData?.generatedOrientation || sourceOrientation || nodeConfig?.orientation || "square",
              });
              success("Background removal completed!", { id: nodeToastId });
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
      error("Failed to remove background. Please try again.", {
        id: nodeToastId,
      });
    }
  } else {
    taskManager.failNodeTask(nodeId);
    error("Please check your image connections");
  }
}
