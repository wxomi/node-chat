"use client";

import { type TargetAndTransition } from "motion/react";

/**
 * Animation variants for the walkthrough circle overlay
 */
export const overlayInitial: TargetAndTransition = {
  opacity: 0,
  scale: 0.9,
};

export const overlayAnimate: TargetAndTransition = {
  opacity: 1,
  scale: 1,
};

export const overlayExit: TargetAndTransition = {
  opacity: 0,
  scale: 0.8,
  filter: "blur(8px)",
};

export const overlayTransition = {
  duration: 0.5,
  ease: "easeOut" as const,
};

/**
 * Animation variants for the checkmark indicator
 */
export const checkmarkInitial: TargetAndTransition = {
  opacity: 0,
  scale: 0.8,
  filter: "blur(8px)",
};

export const checkmarkAnimate: TargetAndTransition = {
  opacity: 1,
  scale: 1,
  filter: "blur(0px)",
};

export const checkmarkTransition = {
  duration: 0.3,
  ease: "easeOut" as const,
};

/**
 * Animation config for directional arrows (left/right/top/bottom)
 */
export const arrowAnimationConfig = {
  duration: 1,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

/**
 * Arrow animation variants for different directions
 */
export const arrowAnimations = {
  left: {
    x: [-4, 4, -4],
  } as TargetAndTransition,
  right: {
    x: [4, -4, 4],
  } as TargetAndTransition,
  top: {
    y: [-4, 4, -4],
  } as TargetAndTransition,
  bottom: {
    y: [4, -4, 4],
  } as TargetAndTransition,
};
