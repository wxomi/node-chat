"use client";

import { useAnimate, type AnimationScope } from "motion/react";
import { useCallback } from "react";

type LiftBlockAnimationConfig = {
  foregroundId: string;
  backgroundId: string;
  liftOffsetX?: number;
  liftOffsetY?: number;
  liftRotation?: number;
  onLiftComplete?: () => void;
};

export function useLiftBlockAnimation({
  foregroundId,
  backgroundId,
  liftOffsetX = 40,
  liftOffsetY = -20,
  liftRotation = -2,
  onLiftComplete,
}: LiftBlockAnimationConfig) {
  const [scope, animate] = useAnimate();

  const handleLiftAnimation = useCallback(async () => {
    // Phase 1: Exit the foreground area
    await animate(
      foregroundId,
      {
        scale: 0.8,
        opacity: 0,
        y: -60,
        filter: "blur(5px)",
      },
      { ease: "easeOut", duration: 0.2 }
    );

    // Phase 2: Reset foreground position
    await animate(
      foregroundId,
      {
        scale: 1,
        rotate: 0,
        filter: "blur(0px)",
        x: 0,
        y: 0,
      },
      {
        ease: "easeOut",
        duration: 0.2,
      }
    );

    // Phase 3: Highlight background and fade in foreground
    await Promise.all([
      animate(
        backgroundId,
        {
          borderStyle: "solid",
          borderColor: "#27293D",
          backgroundColor: "var(--accent)",
          opacity: 1,
        },
        {
          ease: "easeOut",
          duration: 0.5,
        }
      ),
      animate(
        foregroundId,
        {
          opacity: 1,
        },
        {
          ease: "easeOut",
          duration: 0.5,
        }
      ),
    ]);

    // Phase 4: Reset background to dashed state
    await animate(backgroundId, {
      borderStyle: "dashed",
      borderColor: "#454861",
      backgroundColor: "rgba(34, 35, 54, 0.5)",
    });

    // Call completion callback
    onLiftComplete?.();
  }, [animate, foregroundId, backgroundId, onLiftComplete]);

  return {
    scope,
    handleLiftAnimation,
    liftOffsetX,
    liftOffsetY,
    liftRotation,
  };
}
