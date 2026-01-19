"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  WALKTHROUGH_STEPS,
  TOTAL_STEPS,
} from "../../constants/walkthrough/walkthrough-steps";
import {
  useCurrentStep,
  useWalkthroughActions,
  useIsWalkthroughActive,
  useIsStepActive,
} from "../../stores/walkthrough-store";
import {
  Step1Illustration,
  Step2Illustration,
  Step3Illustration,
  Step4Illustration,
  Step5Illustration,
  Step6Illustration,
  Step7Illustration,
  Step8Illustration,
} from "./motion-illustrations";
import useFlowStore from "../../stores/canvas-store";
import { handleImageGenerate } from "../../handlers/image";
import { WALKTHROUGH_TIMING } from "../../constants/walkthrough/walkthrough-timing";
import {
  findImageGeneratorNode,
  isImageGeneratorGenerating,
  findPurpleCircleNodes,
  findWalkthroughPromptNode,
} from "../../lib/walkthrough";
import { cleanupWalkthroughNodes } from "../../lib/walkthrough";
import { createWalkthroughConnection } from "../../lib/walkthrough";
import {
  addImageGeneratorNodeAtDropZone,
  addVideoGeneratorNodeAfterImageGenerator,
} from "../../lib/walkthrough";
import { WALKTHROUGH_NODE_TYPES } from "../../constants/walkthrough/walkthrough-node-types";

const WalkthroughStepper = () => {
  const currentStep = useCurrentStep();
  const isWalkthroughActive = useIsWalkthroughActive();
  const isStep6Active = useIsStepActive(6);
  const { nextStep, skipStep, setIsSkipping, completeWalkthrough } =
    useWalkthroughActions();
  const nodes = useFlowStore((state) => state.nodes);
  const edges = useFlowStore((state) => state.edges);
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  const deleteNode = useFlowStore((state) => state.deleteNode);
  const onEdgesChange = useFlowStore((state) => state.onEdgesChange);
  const [shouldRender, setShouldRender] = useState(true);

  // Find image generator node and check if it's generating
  const imageGeneratorNode = useMemo(() => {
    return findImageGeneratorNode(nodes);
  }, [nodes]);

  const isGenerating: boolean = useMemo(() => {
    return isImageGeneratorGenerating(imageGeneratorNode, isStep6Active);
  }, [isStep6Active, imageGeneratorNode]);

  // Cleanup function to remove walkthrough-specific nodes
  const handleCleanup = useCallback(() => {
    const nodes = useFlowStore.getState().nodes;
    cleanupWalkthroughNodes(nodes, deleteNode, updateNodeData);
  }, [deleteNode, updateNodeData]);

  // Enhanced cleanup function that removes all walkthrough-added nodes and edges
  const handleSkipAllCleanup = useCallback(() => {
    const nodes = useFlowStore.getState().nodes;
    const edges = useFlowStore.getState().edges;

    // Remove walkthrough-specific nodes (purple circles, text node flags)
    cleanupWalkthroughNodes(nodes, deleteNode, updateNodeData);

    // Find and remove image generator nodes (added in step 4)
    const imageGeneratorNodes = nodes.filter(
      (n) => n.type === WALKTHROUGH_NODE_TYPES.IMAGE_GENERATOR
    );
    imageGeneratorNodes.forEach((node) => {
      deleteNode(node.id);
    });

    // Find and remove video generator nodes (added in step 7)
    const videoGeneratorNodes = nodes.filter(
      (n) => n.type === WALKTHROUGH_NODE_TYPES.VIDEO_GENERATOR
    );
    videoGeneratorNodes.forEach((node) => {
      deleteNode(node.id);
    });

    // Find and remove edges connected to walkthrough prompt nodes
    const walkthroughPromptNode = findWalkthroughPromptNode(nodes);
    if (walkthroughPromptNode && onEdgesChange) {
      const connectedEdges = edges.filter(
        (edge) =>
          edge.source === walkthroughPromptNode.id ||
          edge.target === walkthroughPromptNode.id
      );
      if (connectedEdges.length > 0) {
        onEdgesChange(
          connectedEdges.map((edge) => ({ type: "remove", id: edge.id }))
        );
      }
    }
  }, [deleteNode, updateNodeData, onEdgesChange]);

  // Handle step 8 completion
  const handleStep8Completion = useCallback(async () => {
    // Clean up walkthrough nodes first
    handleCleanup();

    // Animate stepper out
    setShouldRender(false);

    // Wait for animation to complete, then mark all steps as completed and deactivate
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.STEP_8_COMPLETION_DELAY)
    );

    // Mark all steps as completed and deactivate walkthrough
    completeWalkthrough();
  }, [handleCleanup, completeWalkthrough]);

  // Auto-complete step 8 after a delay when it becomes active
  useEffect(() => {
    if (currentStep === 8 && isWalkthroughActive) {
      const timeout = setTimeout(() => {
        handleStep8Completion();
      }, WALKTHROUGH_TIMING.STEP_8_AUTO_COMPLETE_DELAY);

      return () => clearTimeout(timeout);
    }
  }, [currentStep, isWalkthroughActive, handleStep8Completion]);

  const handleSkipStep1 = useCallback(async () => {
    // Set skipping state FIRST so circles use synchronized transition
    setIsSkipping(true);

    // Small delay to ensure state propagates before marking circles as deleting
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.STATE_PROPAGATION_DELAY)
    );

    // Get all unconsumed purple circle nodes
    const circleNodes = findPurpleCircleNodes(nodes).filter(
      (n) => !n.data?.isDeleting
    );

    // Mark each as deleting to trigger exit animation (now with synchronized transition)
    circleNodes.forEach((circleNode) => {
      updateNodeData(circleNode.id, { isDeleting: true });
    });

    // Wait for animations to complete
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.SKIP_ANIMATION_DURATION)
    );

    // Advance to next step and reset skipping state
    skipStep();
  }, [nodes, updateNodeData, setIsSkipping, skipStep]);

  const handleSkipStep2 = useCallback(() => {
    // Simply advance to next step without any animations
    skipStep();
  }, [skipStep]);

  const handleSkipStep3 = useCallback(async () => {
    // Set skipping state FIRST so rectangle overlay uses synchronized transition
    setIsSkipping(true);

    // Small delay to ensure state propagates before triggering exit
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.STATE_PROPAGATION_DELAY)
    );

    // Wait for exit animation to complete
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.SKIP_ANIMATION_DURATION)
    );

    // Advance to next step and reset skipping state
    skipStep();
  }, [setIsSkipping, skipStep]);

  const handleSkipStep4 = useCallback(async () => {
    // Set skipping state FIRST so drop zone uses synchronized transition
    setIsSkipping(true);

    // Get rfInstance and addNode from store
    const rfInstance = useFlowStore.getState().rfInstance;
    const addNode = useFlowStore.getState().addNode;
    const nodes = useFlowStore.getState().nodes;

    // Add image generator node at drop zone position before skipping (only if one doesn't exist)
    addImageGeneratorNodeAtDropZone(rfInstance, addNode, nodes);

    // Small delay to ensure node is added before triggering exit
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.STATE_PROPAGATION_DELAY)
    );

    // Wait for exit animation to complete
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.SKIP_ANIMATION_DURATION)
    );

    // Advance to next step and reset skipping state
    skipStep();
  }, [setIsSkipping, skipStep]);

  const handleSkipStep5 = useCallback(async () => {
    // Set skipping state FIRST so handle highlight uses synchronized transition
    setIsSkipping(true);

    // Get nodes, edges, and onConnect from store
    const nodes = useFlowStore.getState().nodes;
    const edges = useFlowStore.getState().edges;
    const onConnect = useFlowStore.getState().onConnect;

    // Find walkthrough prompt node and image generator node
    const promptNode = findWalkthroughPromptNode(nodes);
    const imageGeneratorNode = findImageGeneratorNode(nodes);

    // Programmatically create connection if nodes exist and not already connected
    if (promptNode && imageGeneratorNode && onConnect) {
      // Check if connection already exists
      const connectionExists = edges.some(
        (edge) =>
          edge.source === promptNode.id && edge.target === imageGeneratorNode.id
      );

      if (!connectionExists) {
        createWalkthroughConnection(promptNode, imageGeneratorNode, onConnect);
      }
    }

    // Small delay to ensure connection is created before triggering exit
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.STATE_PROPAGATION_DELAY)
    );

    // Wait for exit animation to complete
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.SKIP_ANIMATION_DURATION)
    );

    // Advance to next step and reset skipping state
    skipStep();
  }, [setIsSkipping, skipStep]);

  const handleSkipStep6 = useCallback(async () => {
    // Set skipping state FIRST so walkthrough generate button uses synchronized transition
    setIsSkipping(true);

    // Get nodes from store
    const nodes = useFlowStore.getState().nodes;

    // Find image generator node
    const imageGeneratorNode = findImageGeneratorNode(nodes);

    // Programmatically trigger generation if node exists
    if (imageGeneratorNode) {
      await handleImageGenerate(imageGeneratorNode.id);
    }

    // Small delay to ensure generation is triggered before triggering exit
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.STATE_PROPAGATION_DELAY)
    );

    // Wait for exit animation to complete
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.SKIP_ANIMATION_DURATION)
    );

    // Advance to next step and reset skipping state
    skipStep();
  }, [setIsSkipping, skipStep]);

  const handleSkipStep7 = useCallback(async () => {
    // Set skipping state FIRST so walkthrough suggestions uses synchronized transition
    setIsSkipping(true);

    // Get nodes and addNodeAfter from store
    const nodes = useFlowStore.getState().nodes;
    const addNodeAfter = useFlowStore.getState().addNodeAfter;

    // Find image generator node
    const imageGeneratorNode = findImageGeneratorNode(nodes);

    // Programmatically add video generator node if image generator node exists
    if (imageGeneratorNode && addNodeAfter) {
      addVideoGeneratorNodeAfterImageGenerator(
        imageGeneratorNode,
        addNodeAfter
      );
    }

    // Small delay to ensure node is added before triggering exit
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.STATE_PROPAGATION_DELAY)
    );

    // Wait for exit animation to complete
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.SKIP_ANIMATION_DURATION)
    );

    // Advance to next step and reset skipping state
    skipStep();
  }, [setIsSkipping, skipStep]);

  const handleSkip = useCallback(() => {
    switch (currentStep) {
      case 1:
        handleSkipStep1();
        break;
      case 2:
        handleSkipStep2();
        break;
      case 3:
        handleSkipStep3();
        break;
      case 4:
        handleSkipStep4();
        break;
      case 5:
        handleSkipStep5();
        break;
      case 6:
        handleSkipStep6();
        break;
      case 7:
        handleSkipStep7();
        break;
      default:
        // For other steps, just advance
        skipStep();
        break;
    }
  }, [
    currentStep,
    handleSkipStep1,
    handleSkipStep2,
    handleSkipStep3,
    handleSkipStep4,
    handleSkipStep5,
    handleSkipStep6,
    handleSkipStep7,
    skipStep,
  ]);

  const handleContinue = useCallback(() => {
    nextStep();
  }, [nextStep]);

  // Handle skip all - completes walkthrough without adding anything
  const handleSkipAll = useCallback(async () => {
    // Clean up all walkthrough nodes and connections
    handleSkipAllCleanup();

    // Animate stepper out
    setShouldRender(false);

    // Wait for animation to complete
    await new Promise((resolve) =>
      setTimeout(resolve, WALKTHROUGH_TIMING.STEP_8_COMPLETION_DELAY)
    );

    // Complete walkthrough
    completeWalkthrough();
  }, [handleSkipAllCleanup, completeWalkthrough]);

  const stepContent = useMemo(() => {
    switch (currentStep) {
      case 1:
        return WALKTHROUGH_STEPS[0];
      case 2:
        return WALKTHROUGH_STEPS[1];
      case 3:
        return WALKTHROUGH_STEPS[2];
      case 4:
        return WALKTHROUGH_STEPS[3];
      case 5:
        return WALKTHROUGH_STEPS[4];
      case 6:
        return WALKTHROUGH_STEPS[5];
      case 7:
        return WALKTHROUGH_STEPS[6];
      case 8:
        return WALKTHROUGH_STEPS[7];
      default:
        return WALKTHROUGH_STEPS[0];
    }
  }, [currentStep]);

  const stepIllustration = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <Step1Illustration key="step-1-illustration" />;
      case 2:
        return <Step2Illustration key="step-2-illustration" />;
      case 3:
        return <Step3Illustration key="step-3-illustration" />;
      case 4:
        return <Step4Illustration key="step-4-illustration" />;
      case 5:
        return <Step5Illustration key="step-5-illustration" />;
      case 6:
        return <Step6Illustration key="step-6-illustration" />;
      case 7:
        return <Step7Illustration key="step-7-illustration" />;
      case 8:
        return <Step8Illustration key="step-8-illustration" />;
      default:
        return null;
    }
  }, [currentStep]);

  // Don't render if walkthrough is not active
  if (!isWalkthroughActive) {
    return null;
  }

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="walkthrough-stepper"
          className="bg-popover border border-node-selected-border rounded-xl mb-8 px-6 py-5 w-[760px] overflow-hidden relative z-[100]"
          initial={{ y: 200, opacity: 0, scale: 0.92 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 200, opacity: 0, scale: 0.92 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ x: "110%", opacity: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ x: "-110%", opacity: 0 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0 }}
              className="flex gap-6"
            >
              {/* illustration container */}
              {stepIllustration}

              <div className="flex flex-col gap-2 flex-1">
                <div className="flex flex-col gap-1">
                  {/* step title */}
                  <div className="text-caption-desktop-medium text-muted-foreground">
                    {stepContent.title}
                  </div>
                  {/* step description */}
                  <div className="text-body-desktop-regular">
                    {stepContent.description}
                  </div>
                </div>
                <div className="flex items-center gap-2 justify-between mt-auto">
                  <div className="text-caption-desktop-medium text-muted-foreground">
                    {currentStep} of {TOTAL_STEPS}
                  </div>
                  {currentStep !== 8 && (
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleSkip}
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "text-muted-foreground bg-[#151628] hover:bg-[#151628]/80",
                          isGenerating
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        )}
                        disabled={isGenerating}
                      >
                        Skip
                      </Button>
                      <Button
                        onClick={handleSkipAll}
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "text-muted-foreground bg-[#151628] hover:bg-[#151628]/80",
                          isGenerating
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        )}
                        disabled={isGenerating}
                      >
                        Skip All
                      </Button>
                      {currentStep === 2 && (
                        <Button onClick={handleContinue} size="sm">
                          Continue
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WalkthroughStepper;
