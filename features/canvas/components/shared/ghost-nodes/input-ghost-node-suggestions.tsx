"use client";

import React, { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import GhostNode from "../../nodes/ghost-node";
import { useInputGhostNodes } from "../../../hooks/use-input-ghost-nodes";
import { NodeFlowConfig } from "../../../types/sidebar.types";

type InputGhostNodeSuggestionsProps = {
  nodeType: string;
  nodeId: string;
  flowConfig: NodeFlowConfig | null;
  edges: any[];
  isHovered: boolean;
  selected?: boolean;
  onHoverChange?: (isInputGhostHovered: boolean) => void;
  onNodeHoverChange?: (isHovered: boolean) => void; // Callback to maintain node hover state
  offset?: number; // Offset from top in pixels to position the ghost node suggestions
  deadzoneHeight?: number; // Height of the deadzone in pixels
  deadzoneOffset?: number; // Offset from top in pixels to position the deadzone
};

// Helper to detect if mouse is leaving to canvas (outside node area)
const isLeavingToCanvas = (target: HTMLElement | null): boolean => {
  return (
    target?.classList?.contains("react-flow__pane") ||
    target?.closest(".react-flow__pane") !== null ||
    !target
  );
};

const InputGhostNodeSuggestions: React.FC<InputGhostNodeSuggestionsProps> =
  memo(
    ({
      nodeType,
      nodeId,
      flowConfig,
      edges,
      isHovered,
      selected,
      onHoverChange,
      onNodeHoverChange,
      offset,
      deadzoneHeight = 400,
      deadzoneOffset,
    }) => {
      const {
        isInputGhostHovered,
        setIsInputGhostHovered,
        isInputGhostContainerHovered,
        setIsInputGhostContainerHovered,
        hasUnconnectedRequiredInputs,
        suggestionsToRender,
        handleAddNodeBefore,
      } = useInputGhostNodes({
        nodeType,
        nodeId,
        flowConfig,
        edges,
      });

      // Notify parent of hover state changes if callback provided
      useEffect(() => {
        if (onHoverChange) {
          onHoverChange(isInputGhostHovered || isInputGhostContainerHovered);
        }
      }, [isInputGhostHovered, isInputGhostContainerHovered, onHoverChange]);

      // Use a stable hover state that doesn't flicker during transitions
      const [stableHovered, setStableHovered] = useState(false);
      const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
      const prevSelectedRef = useRef<boolean | undefined>(selected);
      const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
      // Use refs to track current hover state for timeout checks
      const ghostHoveredRef = useRef(false);
      const ghostContainerHoveredRef = useRef(false);

      // Reset hover states when node becomes unselected
      useEffect(() => {
        if (prevSelectedRef.current === true && selected === false) {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
          }
          setStableHovered(false);
          setIsInputGhostHovered(false);
          setIsInputGhostContainerHovered(false);
        }
        prevSelectedRef.current = selected;
      }, [selected, setIsInputGhostHovered, setIsInputGhostContainerHovered]);

      useEffect(() => {
        const shouldBeHovered =
          isHovered || isInputGhostHovered || isInputGhostContainerHovered;

        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }

        if (shouldBeHovered) {
          setStableHovered(true);
        } else {
          hoverTimeoutRef.current = setTimeout(() => {
            setStableHovered(false);
          }, 50);
        }

        return () => {
          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
          if (leaveTimeoutRef.current) {
            clearTimeout(leaveTimeoutRef.current);
          }
        };
      }, [isHovered, isInputGhostHovered, isInputGhostContainerHovered]);

      const shouldShow =
        (stableHovered || selected) && hasUnconnectedRequiredInputs;

      return (
        <>
          {/* Invisible deadzone between node and input ghost nodes (left side) to prevent flickering */}
          <div
            className="absolute pointer-events-auto"
            style={{
              top: deadzoneOffset !== undefined ? `${deadzoneOffset}px` : "50%",
              left: "0%",
              transform:
                deadzoneOffset !== undefined
                  ? "translateX(calc(-100% + 1px))"
                  : "translate(calc(-100% + 1px), -50%)",
              width: "34px",
              height: `${deadzoneHeight}px`,
            }}
            onMouseEnter={() => {
              if (leaveTimeoutRef.current) {
                clearTimeout(leaveTimeoutRef.current);
                leaveTimeoutRef.current = null;
              }
              ghostHoveredRef.current = true;
              setIsInputGhostHovered(true);
              onNodeHoverChange?.(true);
            }}
            onMouseLeave={(e) => {
              ghostHoveredRef.current = false;
              setIsInputGhostHovered(false);

              if (leaveTimeoutRef.current) {
                clearTimeout(leaveTimeoutRef.current);
                leaveTimeoutRef.current = null;
              }

              const target = e.relatedTarget as HTMLElement;

              // If leaving to canvas, clear immediately
              // Otherwise use timeout to allow transition to container
              if (isLeavingToCanvas(target)) {
                onNodeHoverChange?.(false);
              } else {
                leaveTimeoutRef.current = setTimeout(() => {
                  if (
                    !ghostContainerHoveredRef.current &&
                    !ghostHoveredRef.current
                  ) {
                    onNodeHoverChange?.(false);
                  }
                  leaveTimeoutRef.current = null;
                }, 100);
              }
            }}
          />

          {/* Input ghost node suggestions - left side */}
          <AnimatePresence>
            {shouldShow && (
              <motion.div
                className="absolute right-full flex flex-col gap-16 pointer-events-auto items-center justify-center"
                style={{
                  top: offset !== undefined ? `${offset}px` : "50%",
                  transform:
                    offset !== undefined ? undefined : "translateY(-50%)",
                  minHeight: `${deadzoneHeight}px`,
                }}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  x: -34,
                  scale: 1,
                }}
                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  mass: 0.5,
                }}
                onMouseEnter={() => {
                  if (leaveTimeoutRef.current) {
                    clearTimeout(leaveTimeoutRef.current);
                    leaveTimeoutRef.current = null;
                  }
                  ghostContainerHoveredRef.current = true;
                  setIsInputGhostContainerHovered(true);
                  onNodeHoverChange?.(true);
                }}
                onMouseLeave={(e) => {
                  ghostContainerHoveredRef.current = false;
                  setIsInputGhostContainerHovered(false);

                  if (leaveTimeoutRef.current) {
                    clearTimeout(leaveTimeoutRef.current);
                    leaveTimeoutRef.current = null;
                  }

                  const target = e.relatedTarget as HTMLElement;

                  // If leaving to canvas, clear immediately
                  // Otherwise use timeout to allow transition to deadzone
                  if (isLeavingToCanvas(target)) {
                    onNodeHoverChange?.(false);
                  } else {
                    leaveTimeoutRef.current = setTimeout(() => {
                      if (
                        !ghostContainerHoveredRef.current &&
                        !ghostHoveredRef.current
                      ) {
                        onNodeHoverChange?.(false);
                      }
                      leaveTimeoutRef.current = null;
                    }, 100);
                  }
                }}
              >
                {suggestionsToRender.map((item, index) => {
                  const { suggestion, targetInput, inputIndex } = item;

                  return (
                    <GhostNode
                      key={`${suggestion.nodeType}-${index}`}
                      icon={suggestion.icon}
                      title={suggestion.title}
                      onClick={() => {
                        if (
                          suggestion.nodeType === "single-upload-node" &&
                          targetInput
                        ) {
                          // For single-upload-node, always pass the target input info
                          handleAddNodeBefore(
                            suggestion.nodeType,
                            suggestion.yOffset,
                            inputIndex ?? 0,
                            targetInput.id,
                            targetInput.dataType
                          );
                        } else if (targetInput && inputIndex !== undefined) {
                          handleAddNodeBefore(
                            suggestion.nodeType,
                            suggestion.yOffset,
                            inputIndex,
                            targetInput.id,
                            targetInput.dataType
                          );
                        } else {
                          // Fallback: let addNodeBefore find the right input
                          handleAddNodeBefore(
                            suggestion.nodeType,
                            suggestion.yOffset,
                            0
                          );
                        }
                      }}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      );
    }
  );

InputGhostNodeSuggestions.displayName = "InputGhostNodeSuggestions";

export default InputGhostNodeSuggestions;
