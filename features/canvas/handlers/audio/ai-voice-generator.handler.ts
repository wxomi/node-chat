"use client";

import useFlowStore from "../../stores/canvas-store";
import useConfigStore from "../../stores/config-store";
import { aiVoiceGeneratorConfigSchema } from "../../validations/audio";
import { generateVoice, getAudioDetails } from "../../services/audio";
import { useOperationToasts } from "../../hooks/use-operation-toasts";
import { usePollOperation } from "../../hooks/use-poll-operation";
import { useTaskManagerStore } from "../../stores/task-manager-store";

export async function handleVoiceGenerate(nodeId: string) {
  const { showLoading, dismiss, success, error } = useOperationToasts();
  const { poll } = usePollOperation();
  const nodes = useFlowStore.getState().nodes;
  const node = nodes.find((n) => n.id === nodeId);
  const taskManager = useTaskManagerStore.getState();

  // Start tracking task
  taskManager.startNodeTask({
    nodeId,
    nodeType: node?.type,
    assetName: "Voice",
  });

  const edges = useFlowStore.getState().edges;
  const nodeConfig = useConfigStore.getState().nodeConfigs?.[nodeId];

  const incomingEdges = edges.filter((edge) => edge.target === nodeId);

  // Collect prompt from connected prompt input
  let connectedPrompt = "";
  const promptInputEdges = incomingEdges.filter(
    (edge) => edge.targetHandle === "prompt-input"
  );

  for (const edge of promptInputEdges) {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    if (sourceNode?.data?.prompt) {
      connectedPrompt += (sourceNode.data.prompt as string) + "\n";
    }
  }

  // Get typed prompt from config
  const typedPrompt = nodeConfig?.prompt || "";

  // Combine prompts
  const prompts = [connectedPrompt.trim(), typedPrompt.trim()]
    .filter((p) => p !== "")
    .join("\n");

  const dataToValidate = {
    prompt: prompts,
    voiceName: nodeConfig?.voiceName || "Elon Musk",
    name: nodeConfig?.name,
  };

  const result = aiVoiceGeneratorConfigSchema.safeParse(dataToValidate);

  if (result.success) {
    // Use node ID as toast ID to replace previous toasts for this node
    const nodeToastId = `node-${nodeId}`;
    let loadingToastId: string | number | null = null;

    try {
      // Dismiss any previous toast for this node
      dismiss(nodeToastId as any);

      loadingToastId = showLoading("Generating voice...");

      const apiResult = await generateVoice(result.data);
      dismiss(loadingToastId);
      success("Voice generation started!", { id: nodeToastId });

      useFlowStore.getState().updateNodeData(nodeId, {
        generatedAudioId: apiResult.id,
        creditsCharged: apiResult.credits_charged,
        audioDetails: undefined,
      });

      try {
        await poll({
          fetchData: () => getAudioDetails(apiResult.id),
          isComplete: (data: any) =>
            data.status === "complete" ||
            data.status === "error" ||
            data.status === "canceled",
          onError: (data: any) => {
            taskManager.failNodeTask(nodeId);
            useFlowStore.getState().updateNodeData(nodeId, {
              generatedAudioId: undefined,
              audioDetails: undefined,
              creditsCharged: undefined,
            });
            console.error(
              "[handleVoiceGenerate] Polling completed with error",
              {
                audioId: apiResult.id,
                status: data.status,
                error: data.error,
              }
            );
            error(
              `Voice generation failed: ${
                data.error?.message || "Unknown error"
              }`,
              { id: nodeToastId }
            );
          },
          onCanceled: () => {
            taskManager.failNodeTask(nodeId);
            useFlowStore.getState().updateNodeData(nodeId, {
              generatedAudioId: undefined,
              audioDetails: undefined,
              creditsCharged: undefined,
            });
            console.warn("[handleVoiceGenerate] Polling canceled", {
              audioId: apiResult.id,
            });
            error("Voice generation was canceled", { id: nodeToastId });
          },
          onComplete: (data: any) => {
            try {
              useFlowStore.getState().updateNodeData(nodeId, {
                audioDetails: data,
              });
              success("Voice generation completed!", { id: nodeToastId });
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
        error("Error while checking audio status. Please refresh.", {
          id: nodeToastId,
        });
      }
    } catch (err) {
      if (loadingToastId) dismiss(loadingToastId);
      taskManager.failNodeTask(nodeId);
      error("Failed to generate voice. Please try again.", {
        id: nodeToastId,
      });
    }
  } else {
    taskManager.failNodeTask(nodeId);
    error("Please provide a prompt and select a voice");
  }
}
