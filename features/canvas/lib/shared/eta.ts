export type EtaOptions = {
  nodeType: string;
  nodeConfig?: any;
};

const SECONDS = 1000;

const perFrame = {
  TEXT_TO_VIDEO_v1: 0.28,
  IMAGE_TO_VIDEO_v1: 0.37,
  VIDEO_TO_VIDEO_v3: 2.11,
  LIP_SYNC_v2: 0.36,
  FACE_SWAP_v2: 0.29,
  ANIMATION: 2.41,
} as const;

const medians = {
  AI_IMAGE: 3,
  AI_IMAGE_EDITOR: 13,
  IMAGE_UPSCALER: 17,
  BACKGROUND_REMOVER: 2,
  FACE_SWAP: 3,
} as const;

function clampPositive(n: number) {
  return Math.max(0, n);
}

function assumeFpsFromResolution(res?: "FULL" | "HALF") {
  return res === "FULL" ? 24 : 12;
}

export function formatEta(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function estimateMsForNode({
  nodeType,
  nodeConfig,
}: EtaOptions): number | undefined {
  if (nodeType === "image-generator-node") {
    const count = clampPositive(Number(nodeConfig?.imageCount ?? 1));
    return count * medians.AI_IMAGE * SECONDS;
  }
  if (nodeType === "ai-image-editor-node")
    return medians.AI_IMAGE_EDITOR * SECONDS;
  if (nodeType === "ai-image-upscaler-node")
    return medians.IMAGE_UPSCALER * SECONDS;
  if (nodeType === "remove-background-node")
    return medians.BACKGROUND_REMOVER * SECONDS;
  if (nodeType === "face-swap-node") return medians.FACE_SWAP * SECONDS;

  if (nodeType === "video-generator-node") {
    const mode = nodeConfig?.mode ?? "text-to-video";
    const duration = clampPositive(
      Number((nodeConfig?.endSeconds ?? 5) - (nodeConfig?.startSeconds ?? 0))
    );
    const fps = assumeFpsFromResolution(nodeConfig?.fpsResolution);
    let pf: number = perFrame.TEXT_TO_VIDEO_v1;
    if (mode === "image-to-video") pf = perFrame.IMAGE_TO_VIDEO_v1;
    if (mode === "video-to-video") pf = perFrame.VIDEO_TO_VIDEO_v3;
    return duration * fps * pf * SECONDS;
  }

  if (nodeType === "lip-sync-node") {
    const duration = clampPositive(
      Number((nodeConfig?.endSeconds ?? 15) - (nodeConfig?.startSeconds ?? 0))
    );
    const fps = clampPositive(Number(nodeConfig?.maxFpsLimit ?? 12));
    return duration * fps * perFrame.LIP_SYNC_v2 * SECONDS;
  }

  if (nodeType === "face-swap-video-node") {
    const duration = clampPositive(
      Number((nodeConfig?.endSeconds ?? 15) - (nodeConfig?.startSeconds ?? 0))
    );
    const fps = 12;
    return duration * fps * perFrame.FACE_SWAP_v2 * SECONDS;
  }

  if (nodeType === "animation-node") {
    const duration = clampPositive(Number(nodeConfig?.endSeconds ?? 15));
    const fps = clampPositive(Number(nodeConfig?.fps ?? 12));
    return duration * fps * perFrame.ANIMATION * SECONDS;
  }

  return undefined;
}
