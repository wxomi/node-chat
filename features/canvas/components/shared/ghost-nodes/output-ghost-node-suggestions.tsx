"use client";

import React, { memo, useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import GhostNode from "../../nodes/ghost-node";
import { useOutputGhostNodes } from "../../../hooks/use-output-ghost-nodes";
import { NodeFlowConfig } from "../../../types/sidebar.types";

type OutputGhostNodeSuggestionsProps = {
  nodeType: string;
  nodeId: string;
  flowConfig: NodeFlowConfig | null;
  edges: any[];
  isHovered: boolean;
  selected?: boolean;
  onHoverChange?: (isOutputGhostHovered: boolean) => void;
  onNodeHoverChange?: (isHovered: boolean) => void; // Callback to maintain node hover state
  offset?: number; // Offset from top in pixels to position the ghost node suggestions
  deadzoneHeight?: number; // Height of the deadzone in pixels
  deadzoneOffset?: number; // Offset from top in pixels to position the deadzone
  deadzoneWidth?: number; // Width of the deadzone in pixels (default 32px)
  animationOffsetX?: number; // X offset for animation (default 32px)
  forceShow?: boolean; // Force show suggestions regardless of workflow state
  filterSuggestions?: (suggestion: any) => boolean; // Filter function for suggestions
};

// Helper to detect if mouse is leaving to canvas (outside node area)
const isLeavingToCanvas = (target: HTMLElement | null): boolean => {
  return (
    target?.classList?.contains("react-flow__pane") ||
    target?.closest(".react-flow__pane") !== null ||
    !target
  );
};

const OutputGhostNodeSuggestions: React.FC<OutputGhostNodeSuggestionsProps> =
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
      deadzoneWidth = 32,
      animationOffsetX = 32,
      forceShow = false,
      filterSuggestions,
    }) => {
      const {
        isOutputGhostHovered,
        setIsOutputGhostHovered,
        isOutputGhostContainerHovered,
        setIsOutputGhostContainerHovered,
        isLastInWorkflow,
        suggestionsToRender,
        handleAddNodeAfter,
      } = useOutputGhostNodes({
        nodeType,
        nodeId,
        flowConfig,
        edges,
      });

      // Filter suggestions if filter function provided
      const filteredSuggestions = useMemo(() => {
        if (!filterSuggestions) return suggestionsToRender;
        return suggestionsToRender.filter(filterSuggestions);
      }, [suggestionsToRender, filterSuggestions]);

      // Notify parent of hover state changes if callback provided
      useEffect(() => {
        if (onHoverChange) {
          onHoverChange(isOutputGhostHovered || isOutputGhostContainerHovered);
        }
      }, [isOutputGhostHovered, isOutputGhostContainerHovered, onHoverChange]);

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
          setIsOutputGhostHovered(false);
          setIsOutputGhostContainerHovered(false);
        }
        prevSelectedRef.current = selected;
      }, [selected, setIsOutputGhostHovered, setIsOutputGhostContainerHovered]);

      useEffect(() => {
        const shouldBeHovered =
          isHovered || isOutputGhostHovered || isOutputGhostContainerHovered;

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
      }, [isHovered, isOutputGhostHovered, isOutputGhostContainerHovered]);

      const shouldShow =
        forceShow || ((stableHovered || selected) && isLastInWorkflow);

      return (
        <>
          {/* Invisible deadzone between node and output ghost nodes (right side) to prevent flickering */}
          <div
            className="absolute pointer-events-auto"
            style={{
              top:
                deadzoneOffset !== undefined ? ` ${deadzoneOffset}px` : "50%",
              left: "100%",
              transform:
                deadzoneOffset !== undefined ? undefined : "translateY(-50%)",
              width: `${deadzoneWidth}px`,
              height: `${deadzoneHeight}px`,
            }}
            onMouseEnter={() => {
              if (leaveTimeoutRef.current) {
                clearTimeout(leaveTimeoutRef.current);
                leaveTimeoutRef.current = null;
              }
              ghostHoveredRef.current = true;
              setIsOutputGhostHovered(true);
              onNodeHoverChange?.(true);
            }}
            onMouseLeave={(e) => {
              ghostHoveredRef.current = false;
              setIsOutputGhostHovered(false);

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

          {/* Output ghost node suggestions - right side */}
          <AnimatePresence>
            {shouldShow && (
              <motion.div
                className="absolute left-full flex flex-col gap-16 pointer-events-auto items-center justify-center"
                style={{
                  top: offset !== undefined ? `${offset}px` : "50%",
                  transform:
                    offset !== undefined ? undefined : "translateY(-50%)",
                  minHeight: `${deadzoneHeight}px`,
                }}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  x: animationOffsetX,
                  scale: 1,
                }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
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
                  setIsOutputGhostContainerHovered(true);
                  onNodeHoverChange?.(true);
                }}
                onMouseLeave={(e) => {
                  ghostContainerHoveredRef.current = false;
                  setIsOutputGhostContainerHovered(false);

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
                {filteredSuggestions.map((suggestion, index) => (
                  <GhostNode
                    key={`${suggestion.nodeType}-${index}`}
                    icon={suggestion.icon}
                    title={suggestion.title}
                    onClick={() => {
                      handleAddNodeAfter(
                        suggestion.nodeType,
                        suggestion.yOffset
                      );
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      );
    }
  );

OutputGhostNodeSuggestions.displayName = "OutputGhostNodeSuggestions";

export default OutputGhostNodeSuggestions;
