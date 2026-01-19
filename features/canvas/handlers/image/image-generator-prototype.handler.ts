"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import { imageGeneratorConfigSchema } from "../../validations/image";
import { generateImage, getImageDetails } from "../../services/image";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useTaskManagerStore } from "../../stores/task-manager-store";

export async function handleImageGeneratePrototype(nodeId: string) {
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
  const nodeData = node?.data;

  // Get internal prompt from node data
  const internalPrompt = (nodeData?.prompt as string) || "";

  // Check if external prompt is CONNECTED (filter by prompt-input handle)
  const incomingPromptEdges = edges.filter(
    (edge) => edge.target === nodeId && edge.targetHandle === "prompt-input"
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

  // Use internal orientation from node data (embedded selector)
  const orientation =
    (nodeData?.orientation as "square" | "landscape" | "portrait") ||
    nodeConfig?.orientation ||
    "square";

  // Use internal style from node config (embedded selector)
  const styleTool = nodeConfig?.style?.tool || "general";

  const dataToValidate = {
    imageCount: nodeConfig?.imageCount || 1,
    orientation: orientation,
    style: {
      prompt: finalPrompt,
      tool: styleTool,
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

      // Store the orientation that will be used for this generation (from node data)
      const currentOrientation =
        nodeData?.orientation || nodeConfig?.orientation || "square";

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
                  nodeData?.orientation ||
                  nodeConfig?.orientation ||
                  "square",
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
