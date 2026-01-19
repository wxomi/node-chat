import { create } from "zustand";
import { useMemo, useRef } from "react";
import { triggerCanvasSave } from "../lib/canvas";
import useCanvasMetadataStore from "./canvas-metadata-store";

type WalkthroughState = {
  currentStep: number;
  isActive: boolean;
  stepCompleted: Record<number, boolean>;
  isSkipping: boolean;
  // Actions
  setCurrentStep: (step: number) => void;
  setStepCompleted: (step: number, completed: boolean) => void;
  nextStep: () => void;
  skipStep: () => void;
  setIsActive: (active: boolean) => void;
  setIsSkipping: (skipping: boolean) => void;
  resetWalkthrough: () => void;
  completeWalkthrough: () => void;
};

const useWalkthroughStore = create<WalkthroughState>((set, get) => ({
  currentStep: 1,
  isActive: true, // true = show walkthrough, false = hide walkthrough
  stepCompleted: {},
  isSkipping: false,

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  setStepCompleted: (step: number, completed: boolean) => {
    set((state) => ({
      stepCompleted: {
        ...state.stepCompleted,
        [step]: completed,
      },
    }));
  },

  nextStep: () => {
    const { currentStep } = get();
    // Mark current step as completed
    set((state) => ({
      stepCompleted: {
        ...state.stepCompleted,
        [currentStep]: true,
      },
      currentStep: currentStep + 1,
      isSkipping: false,
    }));
  },

  skipStep: () => {
    const { currentStep } = get();
    // Mark current step as completed and advance
    set((state) => ({
      stepCompleted: {
        ...state.stepCompleted,
        [currentStep]: true,
      },
      currentStep: currentStep + 1,
      isSkipping: false,
    }));
  },

  setIsActive: (active: boolean) => {
    set({ isActive: active });
  },

  setIsSkipping: (skipping: boolean) => {
    set({ isSkipping: skipping });
  },

  resetWalkthrough: () => {
    set({
      currentStep: 1,
      isActive: true, // true = show walkthrough
      stepCompleted: {},
      isSkipping: false,
    });
  },

  completeWalkthrough: () => {
    // Mark all steps as completed and hide walkthrough
    const allStepsCompleted: Record<number, boolean> = {};
    for (let i = 1; i <= 8; i++) {
      allStepsCompleted[i] = true;
    }
    set({
      stepCompleted: allStepsCompleted,
      isActive: false, // false = hide walkthrough (completed)
      isSkipping: false,
    });

    // Trigger save after walkthrough is completed
    const { canvasId, projectName } = useCanvasMetadataStore.getState();
    triggerCanvasSave(canvasId || undefined, projectName);
  },
}));

// Performance-optimized selector hooks to minimize re-renders
export const useCurrentStep = () =>
  useWalkthroughStore((state) => state.currentStep);

export const useIsStepActive = (step: number) =>
  useWalkthroughStore((state) => state.isActive && state.currentStep === step);

export const useIsStepCompleted = (step: number) =>
  useWalkthroughStore((state) => state.stepCompleted[step] ?? false);

// Optimized hook to check if walkthrough is active at all
export const useIsWalkthroughActive = () =>
  useWalkthroughStore((state) => state.isActive);

// OPTIMIZED: Batch multiple step checks into a single subscription
// This reduces subscription overhead when nodes need multiple step states
export const useWalkthroughStepStates = (steps: number[]) => {
  const stepStatesRef = useRef<Record<number, boolean>>({});
  const stepsRef = useRef<number[]>(steps);

  // Update steps ref if array reference changed (but content might be same)
  if (
    stepsRef.current.length !== steps.length ||
    stepsRef.current.some((s, i) => s !== steps[i])
  ) {
    stepsRef.current = steps;
  }

  // Subscribe to walkthrough state with stable selectors
  const isActive = useWalkthroughStore((state) => state.isActive);
  const currentStep = useWalkthroughStore((state) => state.currentStep);

  return useMemo(() => {
    // Recalculate step states
    const result: Record<number, boolean> = {};
    stepsRef.current.forEach((step) => {
      result[step] = isActive && currentStep === step; // isActive = walkthrough is showing
    });

    // Check if any values changed by comparing with previous ref
    const prevStates = stepStatesRef.current;
    const hasChanged = stepsRef.current.some(
      (step) => prevStates[step] !== result[step]
    );

    // Only update ref if values changed, return stable reference otherwise
    if (hasChanged) {
      stepStatesRef.current = result;
      return result;
    }

    return prevStates;
  }, [isActive, currentStep]);
};

// Optimized hook to check if skipping
export const useIsSkipping = () =>
  useWalkthroughStore((state) => state.isSkipping);

export const useWalkthroughActions = () => {
  return useMemo(() => {
    const state = useWalkthroughStore.getState();
    return {
      setCurrentStep: state.setCurrentStep,
      setStepCompleted: state.setStepCompleted,
      nextStep: state.nextStep,
      skipStep: state.skipStep,
      setIsActive: state.setIsActive,
      setIsSkipping: state.setIsSkipping,
      resetWalkthrough: state.resetWalkthrough,
      completeWalkthrough: state.completeWalkthrough,
    };
  }, []);
};

export default useWalkthroughStore;
