import { useState, useEffect, useMemo } from "react";
import type { ButtonState } from "../../components/shared/generate-button/generate-button";

export type AssetDetails = {
  status?: string;
  [key: string]: any;
};

/**
 * Computes button state based on generated ID and asset details
 * @param generatedId - The generated asset ID (e.g., generatedImageId, generatedVideoId, generatedAudioId)
 * @param details - The asset details object with status property
 * @returns The computed button state
 */
export function computeButtonState(
  generatedId: string | undefined,
  details: AssetDetails | undefined
): ButtonState {
  const hasGeneratedId = !!generatedId;
  const hasDetails = !!details;

  // Check if asset details has an error status
  if (details?.status === "error" || details?.status === "canceled") {
    return "error";
  }

  // If we have both generatedId and details, generation is completed
  if (hasGeneratedId && hasDetails) {
    return "completed";
  }

  // If we have generatedId but no details yet, it's generating
  if (hasGeneratedId && !hasDetails) {
    return "generating";
  }

  // Otherwise, idle
  return "idle";
}

/**
 * Hook that computes button state and handles auto-reset from completed to idle
 * @param computedState - The computed button state from computeButtonState
 * @param autoResetDelay - Delay in ms before resetting from completed to idle (default: 1500)
 * @returns The final button state (with auto-reset applied)
 */
export function useButtonStateWithAutoReset(
  computedState: ButtonState,
  autoResetDelay: number = 1500
): ButtonState {
  const [buttonStateOverride, setButtonStateOverride] =
    useState<ButtonState | null>(null);

  useEffect(() => {
    if (computedState === "completed") {
      const timer = setTimeout(() => {
        setButtonStateOverride("idle");
      }, autoResetDelay);
      return () => clearTimeout(timer);
    } else {
      // Reset override when state changes away from completed
      setButtonStateOverride(null);
    }
  }, [computedState, autoResetDelay]);

  return buttonStateOverride ?? computedState;
}

/**
 * Combined hook that computes button state from node data and handles auto-reset
 * This is a convenience hook that combines computeButtonState and useButtonStateWithAutoReset
 * @param generatedId - The generated asset ID
 * @param details - The asset details object
 * @param autoResetDelay - Delay in ms before resetting from completed to idle (default: 1500)
 * @returns The final button state
 */
export function useGenerateButtonState(
  generatedId: string | undefined,
  details: AssetDetails | undefined,
  autoResetDelay: number = 1500
): ButtonState {
  const computedState = useMemo<ButtonState>(
    () => computeButtonState(generatedId, details),
    [generatedId, details]
  );

  return useButtonStateWithAutoReset(computedState, autoResetDelay);
}
