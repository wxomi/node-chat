"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import { imageGeneratorConfigSchema } from "../../validations/image";
import { generateImage, getImageDetails } from "../../services/image";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useTaskManagerStore } from "../../stores/task-manager-store";

export async function handleImageGenerate(nodeId: string) {
  const { showLoading, dismiss, success, error } = useOperationToasts();
  const { poll } = usePollOperation();
  const nodes = useFlowStore.getState().nodes;
  const node = nodes.find((n) => n.id === nodeId);
  const taskManager = useTaskManagerStore.getState();

  // Start tracking task
  taskManager.startNodeTask({
    nodeId,
    nodeType: node?.type,
    assetName: "Image",
  });

  const edges = useFlowStore.getState().edges;
  const nodeConfig = useConfigStore.getState().nodeConfigs?.[nodeId];

  const incomingEdges = edges.filter((edge) => edge.target === nodeId);

  const prompts = incomingEdges
    .map((edge) => {
      const sourceNode = nodes.find((node) => node.id === edge.source);
      return (sourceNode?.data?.prompt as string) || "";
    })
    .filter((p) => p.trim() !== "")
    .join("\n");

  const dataToValidate = {
    imageCount: nodeConfig?.imageCount || 1,
    orientation: nodeConfig?.orientation || "landscape",
    style: {
      prompt: prompts,
      tool: nodeConfig?.style?.tool || "general",
    },
    name: nodeConfig?.name,
  };

  const result = imageGeneratorConfigSchema.safeParse(dataToValidate);

  if (result.success) {
    // Use node ID as toast ID to replace previous toasts for this node
    const nodeToastId = `node-${nodeId}`;
    let loadingToastId: string | number | null = null;

    try {
      // Dismiss any previous toast for this node
      dismiss(nodeToastId as any);

      loadingToastId = showLoading("Generating image...");

      const apiResult = await generateImage(result.data);
      dismiss(loadingToastId);
      success("Image generation started!", { id: nodeToastId });

      // Store the orientation that will be used for this generation
      const currentOrientation = nodeConfig?.orientation || "landscape";

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
            error(
              `Image generation failed: ${
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
            error("Image generation was canceled", { id: nodeToastId });
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
                  nodeConfig?.orientation ||
                  "landscape",
              });
              success("Image generation completed!", { id: nodeToastId });
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
      error("Failed to generate image. Please try again.", { id: nodeToastId });
    }
  } else {
    taskManager.failNodeTask(nodeId);
    error("Please check your configuration and try again");
  }
}
