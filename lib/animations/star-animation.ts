// lib/animations/star-animation.ts

// Common animation configuration for sparkle/stars
export const STAR_ANIMATION_CONFIG = {
  initial: {
    opacity: 0,
    filter: "blur(8px)" as const,
    scale: 0.5,
  },
  animate: {
    opacity: [0, 1, 0.3, 1, 0.3, 1, 0],
    filter: "blur(0px)" as const,
    scale: [0.5, 1, 1, 1, 1, 0.8, 0.5],
  },
  exit: {
    opacity: 0,
    filter: "blur(8px)" as const,
    scale: 0.5,
  },
  opacityTransition: {
    ease: [0.4, 0, 0.6, 1] as [number, number, number, number],
    times: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1],
  },
  filterTransition: {
    duration: 1,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  rotateTransition: {
    duration: 0.8,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
  scaleTransition: {
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    times: [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1],
  },
};

