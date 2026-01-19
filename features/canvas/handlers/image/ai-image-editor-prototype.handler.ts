"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import { aiImageEditorConfigSchema } from "../../validations/image";
import { editImage, getImageDetails } from "../../services/image";
import { type ImageDetails } from "../../lib/image";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useTaskManagerStore } from "../../stores/task-manager-store";

import { getConnectedAssetUrl } from "../../lib/canvas";
import { getOrientationFromSource } from "../../lib/shared/orientation-propagation";

export async function handleAIImageEditPrototype(nodeId: string) {
  const { showLoading, dismiss, success, error } = useOperationToasts();
  const { poll } = usePollOperation();
  const nodes = useFlowStore.getState().nodes;
  const node = nodes.find((n) => n.id === nodeId);
  const taskManager = useTaskManagerStore.getState();

  // Start tracking task
  taskManager.startNodeTask({
    nodeId,
    nodeType: node?.type,
    assetName: "Image Edit",
  });

  const edges = useFlowStore.getState().edges;
  const { nodeConfigs, updateNodeConfig } = useConfigStore.getState();
  const nodeConfig = nodeConfigs?.[nodeId];
  const nodeData = node?.data;

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

  const incomingEdges = edges.filter((edge) => edge.target === nodeId);

  const imageInputEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "image-input"
  );
  if (imageInputEdges.length > 1) {
    taskManager.failNodeTask(nodeId);
    error(
      "AI Image Editor only accepts one image. Please remove extra connections."
    );
    return;
  }

  // Get internal prompt from node data (embedded prompt)
  const internalPrompt = (nodeData?.prompt as string) || "";

  // Check if external prompt is CONNECTED (filter by prompt-input handle)
  const incomingPromptEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "prompt-input"
  );

  const hasExternalConnection = incomingPromptEdges.length > 0;

  // Get external prompt if connected (maxConnections: 1, so only first edge)
  let externalPrompt = "";
  if (hasExternalConnection) {
    const edge = incomingPromptEdges[0];
    const sourceNode = nodes.find((node) => node.id === edge.source);
    externalPrompt = (sourceNode?.data?.prompt as string) || "";
  }

  // Determine which prompt to use based on CONNECTION, not text content
  let finalPrompt: string;

  if (hasExternalConnection) {
    // External is connected - prioritize external over internal
    if (externalPrompt.trim() !== "") {
      finalPrompt = externalPrompt;
    } else {
      // External connected but empty - show error
      taskManager.failNodeTask(nodeId);
      error("Please enter a prompt in the connected prompt node");
      return;
    }
  } else {
    // No external connection - use internal prompt
    if (internalPrompt.trim() !== "") {
      finalPrompt = internalPrompt;
    } else {
      // No external connection and internal is empty - show error
      taskManager.failNodeTask(nodeId);
      error("Please enter a prompt in the text area");
      return;
    }
  }

  let imageFilePath = "";

  // Get image asset using helper
  if (imageInputEdges.length > 0) {
    const imageEdge = imageInputEdges[0];
    const sourceNode = nodes.find((node) => node.id === imageEdge.source);

    if (sourceNode) {
      const imageAssetResult = getConnectedAssetUrl(sourceNode, {
        ...imageEdge,
        sourceHandle: imageEdge.sourceHandle ?? null,
      });
      if (imageAssetResult) {
        imageFilePath = imageAssetResult.url;
        console.log("[handleAIImageEditPrototype] Retrieved image asset", {
          sourceNodeId: imageEdge.source,
          sourceNodeType: sourceNode.type,
          assetType: imageAssetResult.assetInfo?.type,
          fileName: imageAssetResult.assetInfo?.fileName,
        });
      } else {
        console.warn("[handleAIImageEditPrototype] Failed to get image asset", {
          sourceNodeId: imageEdge.source,
          sourceNodeType: sourceNode.type,
          sourceHandle: imageEdge.sourceHandle,
        });
      }
    }
  }

  const dataToValidate = {
    prompt: finalPrompt,
    imageFilePath: imageFilePath,
  };

  const result = aiImageEditorConfigSchema.safeParse(dataToValidate);

  if (result.success) {
    console.log("[handleAIImageEditPrototype] Validation passed", {
      nodeId,
      prompt: finalPrompt,
      imageFilePath,
    });

    // Use node ID as toast ID to replace previous toasts for this node
    const nodeToastId = `node-${nodeId}`;
    let loadingToastId: string | number | null = null;

    try {
      // Dismiss any previous toast for this node
      dismiss(nodeToastId as any);

      loadingToastId = showLoading("Editing image...");

      const apiResult = await editImage(result.data);
      dismiss(loadingToastId);
      success("Image editing started!", { id: nodeToastId });

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
            console.error(
              "[handleAIImageEditPrototype] Polling completed with error",
              {
                imageId: apiResult.id,
                status: data.status,
                error: data.error,
              }
            );
            error(
              `Image editing failed: ${data.error?.message || "Unknown error"}`,
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
            console.warn("[handleAIImageEditPrototype] Polling canceled", {
              imageId: apiResult.id,
            });
            error("Image editing was canceled", { id: nodeToastId });
          },
          onComplete: (data: any) => {
            try {
              const currentData = useFlowStore
                .getState()
                .nodes.find((n) => n.id === nodeId)?.data;
              useFlowStore.getState().updateNodeData(nodeId, {
                imageDetails: data,
                // Keep the generatedOrientation when image completes
                generatedOrientation:
                  currentData?.generatedOrientation ||
                  sourceOrientation ||
                  nodeConfig?.orientation ||
                  "square",
              });
              success("Image editing completed!", { id: nodeToastId });
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
      console.error("[handleAIImageEditPrototype] Validation failed", {
        nodeId,
        prompt: finalPrompt,
        imageFilePath,
        error: err,
      });
      error("Failed to edit image. Please try again.", { id: nodeToastId });
    }
  } else {
    taskManager.failNodeTask(nodeId);
    const flattened = result.error.flatten();
    console.error("[handleAIImageEditPrototype] Validation failed", {
      nodeId,
      prompt: finalPrompt,
      imageFilePath,
      formErrors: flattened.formErrors,
      fieldErrors: flattened.fieldErrors,
    });
    error("Please provide a prompt and connect an image");
  }
}
