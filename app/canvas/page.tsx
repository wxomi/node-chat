import React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { Canvas } from "@/features/canvas/components";
import { getUserCanvasId } from "@/features/canvas/services/canvas";
import { nanoid } from "nanoid";

const CanvasPage = async () => {
  // Check if user has existing canvas
  let canvasId: string | null = null;

  try {
    canvasId = await getUserCanvasId();
  } catch (error) {
    console.error("[Canvas Page] Failed to get user canvas:", error);
    // Continue with new canvas creation on error
  }

  // If no canvas exists, generate new ID
  if (!canvasId) {
    canvasId = nanoid();
  }

  return (
    <ReactFlowProvider>
      <Canvas canvasId={canvasId} />
    </ReactFlowProvider>
  );
};

export default CanvasPage;
