import type { Node, Connection } from "@xyflow/react";
import { WALKTHROUGH_DATA_TYPES } from "../../constants/walkthrough/walkthrough-node-types";

export const createWalkthroughConnection = (
  promptNode: Node,
  imageGeneratorNode: Node,
  onConnect: (connection: Connection) => void
) => {
  const promptFlowConfig = promptNode.data?.flowConfig as any;
  const imageFlowConfig = imageGeneratorNode.data?.flowConfig as any;

  const promptOutputHandle = promptFlowConfig?.outputs?.find(
    (output: any) => output.dataType === WALKTHROUGH_DATA_TYPES.STRING
  );

  const imageInputHandle = imageFlowConfig?.inputs?.find(
    (input: any) => input.dataType === WALKTHROUGH_DATA_TYPES.STRING
  );

  if (promptOutputHandle && imageInputHandle) {
    onConnect({
      source: promptNode.id,
      target: imageGeneratorNode.id,
      sourceHandle: promptOutputHandle.id,
      targetHandle: imageInputHandle.id,
    });
  }
};

