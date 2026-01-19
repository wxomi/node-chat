"use client";

import React, {
  memo,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckIcon } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useLiftBlockAnimation } from "@/lib/animations/lift-block-animation";
import useFlowStore from "@/features/canvas/stores/canvas-store";
import GripHandle from "./grip-handle";

type PromptBlockProps = {
  nodeId: string;
  prompt: string;
  placeholder?: string;
  targetHandle?: string;
  sourceNodeType?: string;
  dragMimeType?: string;
  liftOffsetX?: number;
  liftOffsetY?: number;
  liftRotation?: number;
  foregroundId?: string;
  backgroundId?: string;
  className?: string;
  onPromptChange?: (prompt: string) => void;
  onPromptBlur?: (prompt: string) => void;
};

const PromptBlock: React.FC<PromptBlockProps> = memo(
  ({
    nodeId,
    prompt,
    placeholder = "Enter your prompt here...",
    targetHandle = "prompt-input",
    sourceNodeType = "text-node",
    dragMimeType = "application/prompt-node-drag",
    liftOffsetX = 40,
    liftOffsetY = -20,
    liftRotation = -2,
    foregroundId = "#foreground-textarea",
    backgroundId = "#background-textarea",
    className,
    onPromptChange,
    onPromptBlur,
  }) => {
    // All state management
    const [localPrompt, setLocalPrompt] = useState<string>(prompt || "");
    const [isLifted, setIsLifted] = useState<boolean>(false);
    const [isDragging, setIsDragging] = useState<boolean>(false);

    const updateNodeData = useFlowStore((state) => state.updateNodeData);
    const edges = useFlowStore((state) => state.edges);
    const nodes = useFlowStore((state) => state.nodes);

    // Sync local state when prompt prop changes
    useEffect(() => {
      if (prompt !== localPrompt) {
        setLocalPrompt(prompt || "");
      }
    }, [prompt]);

    // Check if source node is connected
    const isConnected = useMemo(() => {
      return edges.some((edge) => {
        if (edge.target === nodeId && edge.targetHandle === targetHandle) {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          return sourceNode?.type === sourceNodeType;
        }
        return false;
      });
    }, [edges, nodes, nodeId, targetHandle, sourceNodeType]);

    // Animation hook
    const {
      scope,
      handleLiftAnimation,
      liftOffsetX: x,
      liftOffsetY: y,
      liftRotation: rotation,
    } = useLiftBlockAnimation({
      foregroundId,
      backgroundId,
      liftOffsetX,
      liftOffsetY,
      liftRotation,
      onLiftComplete: () => setIsLifted(false),
    });

    // Auto-trigger animation when connection is made
    const prevConnectedRef = useRef<boolean>(false);
    useEffect(() => {
      if (isConnected && !prevConnectedRef.current && isLifted) {
        handleLiftAnimation();
      }
      prevConnectedRef.current = isConnected;
    }, [isConnected, isLifted, handleLiftAnimation]);

    // Reset lifted state if drag was cancelled
    useEffect(() => {
      if (!isDragging && isLifted && !isConnected) {
        setIsLifted(false);
      }
    }, [isDragging, isLifted, isConnected]);

    // Handlers
    const handlePromptChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newPrompt = e.target.value;
        setLocalPrompt(newPrompt);
        onPromptChange?.(newPrompt);
      },
      [onPromptChange]
    );

    const handlePromptBlur = useCallback(() => {
      if (localPrompt !== prompt) {
        updateNodeData(nodeId, { prompt: localPrompt });
        onPromptBlur?.(localPrompt);
      }
    }, [nodeId, localPrompt, prompt, updateNodeData, onPromptBlur]);

    const getDragData = useCallback(() => {
      return {
        nodeId,
        prompt: localPrompt || "",
      };
    }, [nodeId, localPrompt]);

    const handleLiftedDragStart = useCallback(
      (e: React.DragEvent) => {
        if (!isLifted || isConnected) {
          e.preventDefault();
          return;
        }
        setIsDragging(true);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(dragMimeType, JSON.stringify(getDragData()));
        e.stopPropagation();
      },
      [isLifted, isConnected, getDragData, dragMimeType]
    );

    const handleGripDragStart = useCallback(
      (e: React.DragEvent) => {
        if (isConnected) {
          e.preventDefault();
          return;
        }
        setIsLifted(true);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(dragMimeType, JSON.stringify(getDragData()));
        e.stopPropagation();
      },
      [isConnected, getDragData, dragMimeType]
    );

    const handleDragEnd = useCallback(() => {
      setIsDragging(false);
    }, []);

    const handleGripClick = useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
    }, []);

    return (
      <motion.div
        className={cn("relative", className)}
        style={{ zIndex: 10 }}
        ref={scope}
      >
        {/* Background textarea - always visible, stays in place */}
        <textarea
          id={backgroundId.replace("#", "")}
          className="nodrag absolute top-0 left-0 w-full resize-none border border-node-selected-border border-dashed rounded-lg p-3 text-caption-desktop-regular placeholder:text-muted-foreground/50 outline-none overflow-y-auto connection-menu-scrollbar max-h-[240px] pointer-events-none"
          placeholder={placeholder}
          rows={4}
          readOnly
          style={{
            zIndex: 0,
            backgroundColor: "rgba(34, 35, 54, 0.5)",
          }}
        />

        {/* Foreground textarea with motion animation */}
        <motion.div
          id={foregroundId.replace("#", "")}
          initial={{ x: 0, y: 0 }}
          whileTap={{ scale: isLifted ? 0.98 : 1 }}
          animate={{
            x: isLifted ? x : 0,
            y: isLifted ? y : 0,
            rotate: isLifted ? rotation : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 20,
            mass: 1,
          }}
          className={cn(
            "relative",
            isLifted && !isConnected && "cursor-pointer"
          )}
          style={{ zIndex: isLifted ? 10000 : 11 }}
          data-embedded-prompt="true"
        >
          {/* Draggable container */}
          <div
            draggable={isLifted && !isConnected}
            onDragStart={handleLiftedDragStart}
            onDragEnd={handleDragEnd}
            className="w-full"
          >
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <textarea
                  value={localPrompt || ""}
                  onChange={
                    !isLifted && !isConnected ? handlePromptChange : undefined
                  }
                  onBlur={
                    !isLifted && !isConnected ? handlePromptBlur : undefined
                  }
                  className={cn(
                    "w-full resize-none border border-[#27293D] rounded-lg py-3 pl-3 pr-6 bg-accent text-caption-desktop-regular placeholder:text-muted-foreground outline-none overflow-y-auto connection-menu-scrollbar max-h-[240px]",
                    isLifted &&
                      "shadow-md ring-1 ring-offset-2 ring-[#27293D] ring-offset-popover cursor-pointer",
                    isConnected && "cursor-not-allowed"
                  )}
                  placeholder={placeholder}
                  rows={4}
                  readOnly={isLifted || isConnected}
                />
              </TooltipTrigger>
              {isConnected && (
                <TooltipContent
                  side="right"
                  align="center"
                  sideOffset={8}
                  className="bg-muted text-white text-caption-desktop-regular py-1 px-3 rounded-md border border-node-selected"
                >
                  <p>External prompt in use</p>
                </TooltipContent>
              )}
            </Tooltip>

            {/* Animated check icon - show when prompt is connected */}
            <AnimatePresence>
              {isConnected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.8, filter: "blur(5px)" }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.5 }}
                  className="absolute bottom-4 right-3 z-10"
                >
                  <CheckIcon size={10} className="text-success" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grip handle */}
            <GripHandle
              isDisabled={isConnected}
              isLifted={isLifted}
              onDragStart={handleGripDragStart}
              onDragEnd={handleDragEnd}
              onClick={handleGripClick}
            />
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

PromptBlock.displayName = "PromptBlock";

export default PromptBlock;
